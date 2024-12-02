const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({
  path: './.env'
});
const moment = require('moment');
const express = require('express')
const mysql = require('mysql')
const cors = require('cors')

const scheduler = require('./scheduler');


const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())

const Host = process.env.HOST;
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const PORT = process.env.PORT || 8081;

const pool = mysql.createPool({
  host: process.env.DB_HOST, // 从环境变量中获取 MySQL 服务器地址
  user: process.env.DB_USER, // 从环境变量中获取 MySQL 用户名
  password: process.env.DB_PASSWORD, // 从环境变量中获取 MySQL 密码
  database: process.env.DB_NAME, // 从环境变量中获取数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 定义功耗kwh计算函数（参数有风速）
function calculateCostPerHour(windSpeed) {
  let costPerHour = 1.2; // 基础费用
  if (windSpeed === '高') {
    costPerHour += 0.5; // 高风速增加额外费用
  } else if (windSpeed === '中') {
    costPerHour += 0.3; // 中风速增加额外费用
  }
  return costPerHour;
}

/**** 1.1 空调调整接口 ****/
app.post('/aircon/control', (req, res) => {
  const {
    roomId,
    ...newSettings
  } = req.body; // 从请求体中解构获取 roomId 和其他设置

  // 验证 roomId 是否存在
  if (!roomId) {
    return res.json({
      code: 1,
      message: '缺少房间号',
      data: null
    });
  }

  // 读取req中的设置
  const{power, temperature, windSpeed, sweep} = newSettings;
  let mode = '';

  // 从central_settings表中获取mode, central_settings表中只有一行数据
  const sqlGetMode = 'SELECT * FROM central_settings';

  pool.query(sqlGetMode, (err, result) => {
    if(err){
      console.error('获取中央空调设置失败:', err);
      return res.json({
        code: 1,
        message: '获取中央空调设置失败',
        data: null
      });
    }
    mode = result[0].mode
    // 构建最终 SQL 语句
    const sqlUpdateSettings = `
      UPDATE settings
      SET power = ?, setTemperature = ?, windSpeed = ?, mode = ?, sweep = ?
      WHERE roomId = ?
    `;

    // 执行更新设置
    pool.query(sqlUpdateSettings, [power, temperature, windSpeed, mode, sweep, roomId], (err) => {
      if (err) {
        console.error('更新设置失败:', err);
        return res.json({
          code: 1,
          message: '更新设置失败',
          data: null
        });
      }

      // 记录空调设置更新的历史
      let time = moment();
      // 查找上一次设置（id字段最大的字段，若查找记录为空返回一个值，不报错），计算两次修改时间差
      let lastRecord = [];
      let cost = 0;
      let lastTime = '';
      let costPerHour = 0;
      const sqlGetLastSetting = `
        SELECT * FROM aircon_history 
        WHERE roomId = ? AND time > (SELECT checkInTime FROM rooms WHERE roomId = ?)
        ORDER BY id DESC LIMIT 1
      `;
      pool.query(sqlGetLastSetting, [roomId, roomId], (err, result) => {
        if (err) {
          console.error('查询历史设置失败:', err);
          return res.json({
            code: 1,
            message: '查询历史设置失败',
            data: null
          });
        }
      if (!result || result.length === 0) {
        cost = 0;
      } else {
        lastRecord = result[0];
        if (lastRecord.length === 0) {
          cost = 0;
        } else if (lastRecord.power === 'off'){
          cost = 0;
        } else {
          lastTime = moment(lastRecord.time);
          // 调用函数计算单位时间kWh消耗计算费用，并通过时间差计算cost
          // 一度电1元
          const feePerPoint = 1;

          costPerHour = calculateCostPerHour(lastRecord.windSpeed || '');
          cost = costPerHour * moment.duration(time.diff(lastTime)).asHours();
        }
      }
      time = time.format('YYYY-MM-DD HH:mm:ss');
      // 插入新的设置
      const sqlInsertHistory = `
        INSERT INTO aircon_history (roomId, time, cost, power, temperature, windSpeed, sweep)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      pool.query(sqlInsertHistory, [roomId, time, cost, power, temperature, windSpeed, sweep], (err) => {
        if (err) {
          console.error('记录设置历史失败:', err);
          return res.json({
            code: 1,
            message: '记录设置历史失败',
            data: null
          });
        }

        // 成功更新后返回标准格式的响应
        res.json({
          code: 0,
          message: '设置已更新并记录到历史',
        });
      });
    }); 
    });
  });
});


/**** 1.2 获取该房间当前情况接口 ****/
app.get('/aircon/panel', (req, res) => {
  const roomId = req.query.roomId; // 从查询参数中获取房间号
  // 检查是否提供了房间号
  if (!roomId) {
    return res.json({
      code: 400,
      message: '缺少房间号参数',
      data: null
    });
  }
  const sql = 'SELECT * FROM settings WHERE roomId = ?';
  pool.query(sql, [roomId], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({
        code: 1,
        message: '服务器错误',
        data: null
      });
    }
    if (result.length > 0) {
      // 找到房间设置
      return res.json({
        code: 0,
        message: '操作成功',
        data: {
          roomTemperature: result[0].roomTemperature,
          power: result[0].power,
          temperature: result[0].setTemperature,
          windSpeed: result[0].windSpeed,
          mode: result[0].mode,
          sweep: result[0].sweep,
          cost: Number(result[0].cost),
          totalCost: Number(result[0].totalCost)
        }
      });
    } else {
      // 未找到房间设置
      return res.json({
        code: 1,
        message: '未找到该房间的设置',
        data: null
      });
    }
  });
});

/**** 2.1 管理员登录接口 ****/
/**** 已完成 ***************/
app.post('/admin/login', (req, res) => {
  const {
    username,
    password
  } = req.body;
  
  pool.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error ){
      console.error('数据库拉取数据失败', error);
      return res.json({
        code: 1,
        message: '服务器数据库连接错误，联系管理人员',
        token: null,
        role: null
      });
      } 
    if (results.length === 0) {
        return res.json({
        code: 1,
        message: '用户不存在',
        token: null,
        role: null
      });
      } 

    const user = results[0];
    if (user.password !== password) {
        console.log('密码错误');
        return res.json({
        code: 1,
        message: '密码错误',
        token: null,
        role: null
      });
      }

    const token = jwt.sign({
      userId: username,
      role: user.role
    }, jwtSecretKey, {
      expiresIn: '1h'
    });
    return res.json({
      code: 0,
      message: '登录成功',
      token: token,
      role: user.role
    });
    }
  );
 
});

/**** 3.1 获取整个酒店入住情况 ****/
app.post('/stage/query', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
            data: null
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
      data: null
  });
  }

  const sql = `
    SELECT 
      r.roomId,
      r.roomLevel,
      r.cost,
      DATE_FORMAT(r.checkInTime, '%Y-%m-%dT%H:%i:%s+08:00') as checkInTime,
      COALESCE(
        JSON_ARRAYAGG(
          CASE 
            WHEN p.peopleId IS NOT NULL 
            THEN JSON_OBJECT(
              'peopleId', p.peopleId,
              'peopleName', p.peopleName
            )
            ELSE NULL
          END
        ),
        JSON_ARRAY()
      ) as people
    FROM rooms r
    LEFT JOIN roomPeople rp ON r.roomId = rp.roomId
    LEFT JOIN people p ON rp.peopleId = p.peopleId
    GROUP BY r.roomId
    ORDER BY r.roomId`;

  pool.query(sql, (err, result) => {
    if (err) {
      console.error('获取房间数据失败:', err);
      return res.json({
        code: 1,
        message: '获取房间数据失败',
        data: null
      });
    }

    try {
      // 处理每个房间的数据
      const processedResult = result.map(room => {
        // 如果checkInTime为null，返回null
        if (!room.checkInTime) {
          room.checkInTime = null;
        } else {
          room.checkInTime = moment(room.checkInTime).format('YYYY-MM-DDTHH:mm:ss');
        }
        

        // 确保 people 是数组
        let people = [];

        try {
          // 如果 people 是字符串，尝试解析它
          if (typeof room.people === 'string') {
            people = JSON.parse(room.people);
          } else {
            people = room.people;
          }

          // 确保 people 是数组，并过滤掉 null 值
          people = Array.isArray(people) ? people.filter(person => person !== null) : [];

          // 处理单人情况（如果返回的是单个对象而不是数组）
          if (!Array.isArray(people) && typeof people === 'object' && people !== null) {
            people = [people];
          }
        } catch (parseError) {
          console.error('解析 people 数据失败:', parseError);
          people = [];
        }

        return {
          ...room,
          people
        };
      });

      return res.json({
        code: 0,
        message: '查询成功',
        data: processedResult
      });
    } catch (processError) {
      console.error('处理房间数据失败:', processError);
      return res.json({
        code: 1,
        message: '处理房间数据失败',
        data: null
      });
    }
  });
});


/**** 3.2 办理入住接口****/
app.post('/stage/add', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }

  const {
    roomId,
    peopleName
  } = req.body;

  // 参数验证
  if (!roomId || !peopleName) {
    return res.json({
      code: 1,
      message: '房间号和顾客姓名不能为空'
    });
  }

    // 1.插入roomId，checkInTime到checkin_history表
    let time = moment().format('YYYY-MM-DD HH:mm:ss');
    const sqlInsertCheckInHistory = 'INSERT INTO checkin_history (roomId, checkInTime) VALUES (?, ?)';
    pool.query(sqlInsertCheckInHistory, [roomId, time], (err) => {
      if (err) {
        console.error('添加入住记录失败:', err);
        return res.json({
          code: 1,
          message: '办理失败，添加入住记录失败'
        });
      }
    });
    // 2. 插入顾客信息到 people 表
    const sqlInsertPeople = 'INSERT INTO people (peopleName) VALUES (?)';
    pool.query(sqlInsertPeople, [peopleName], (err, peopleResult) => {
      if (err) {
        console.error('添加顾客信息失败:', err);
        return res.json({
          code: 1,
          message: '办理失败，添加顾客信息失败'
        });
      }

      const peopleId = peopleResult.insertId;

      // 3. 在 roomPeople 表中建立关联
      const sqlInsertRoomPeople = 'INSERT INTO roomPeople (roomId, peopleId) VALUES (?, ?)';
      pool.query(sqlInsertRoomPeople, [roomId, peopleId], (err) => {
        if (err) {
          console.error('建立房间顾客关联失败:', err);
          return res.json({
            code: 1,
            message: '办理失败，建立房间顾客关联失败'
          });
        }

        // 4. 更新 rooms 表的入住状态
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        const sqlUpdateRoom = `
          UPDATE rooms 
          SET checkInTime = ?,
              checkedIn = 1 
          WHERE roomId = ?`;

        pool.query(sqlUpdateRoom, [time, roomId], (err) => {
          if (err) {
            console.error('更新房间状态失败:', err);
            return res.json({
              code: 1,
              message: '办理失败，更新房间状态失败'
            });
          }

          res.json({
            code: 0,
            message: '顾客入住办理成功'
          });
        });
      });
    });
  });



/**** 3.3 办理退房 */
app.get('/stage/delete', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }
  
  const roomId = req.query.roomId;

  // 参数验证
  if (!roomId) {
    return res.json({
      code: 1,
      message: '退房失败，房间号不能为空'
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('获取数据库连接失败:', err);
      return res.json({
        code: 1,
        message: '退房失败，服务器错误1'
      });
    }

    // 开启事务
    connection.beginTransaction((err) => {
      if (err) {
        console.error('开启事务失败:', err);
        connection.release();
        return res.json({
          code: 1,
          message: '退房失败，服务器错误2'
        });
      }
      // 1. 更新该roomId的checkOutTime
      let time = moment().format('YYYY-MM-DD HH:mm:ss');
      const sqlUpdateCheckOutTime = 'UPDATE checkin_history SET checkOutTime = ? WHERE roomId = ?';
      connection.query(sqlUpdateCheckOutTime, [time, roomId], (err) => {
        if (err) {
          console.error('更新退房时间失败:', err);
          return connection.rollback(() => {
            connection.release();
            res.json({
              code: 1,
              message: '退房失败，更新退房时间失败'
            });
          });
        } 
        // 2. 删除房间人员关联记录
        const sqlDeleteRoomPeople = 'DELETE FROM roomPeople WHERE roomId = ?';
        connection.query(sqlDeleteRoomPeople, [roomId], (err) => {
          if (err) {
            console.error('删除房间顾客关联失败:', err);
            return connection.rollback(() => {
              connection.release();
              res.json({
                code: 1,
                message: '退房失败，删除房间顾客关联失败'
              });
            });
          }
          // 3. 更新房间状态
          const sqlUpdateRoom = `
            UPDATE rooms 
            SET checkInTime = NULL,
                checkedIn = 0,
                cost = 0
            WHERE roomId = ?`;

          connection.query(sqlUpdateRoom, [roomId], (err) => {
            if (err) {
              console.error('更新房间状态失败:', err);
              return connection.rollback(() => {
                connection.release();
                res.json({
                  code: 1,
                  message: '退房失败，更新房间状态失败'
                });
              });
            }
            // 4. 更新空调设置为默认值 roomTemperature 更新为表中的initTemperature值
            const sqlUpdateSettings = `
              UPDATE settings 
              SET power = 'off',
                  setTemperature = 26,
                  roomTemperature = (SELECT initTemperature FROM rooms WHERE roomId = ?),
                  windSpeed = '中',
                  mode = (SELECT mode FROM central_settings),
                  sweep = '关',
                  cost = 0
              WHERE roomId = ?`;

            connection.query(sqlUpdateSettings, [roomId, roomId], (err) => {
              if (err) {
                console.error('更新空调状态失败:', err);
                return connection.rollback(() => {
                  connection.release();
                  res.json({
                    code: 1,
                    message: '退房失败，更新空调状态失败'
                  });
                });
              }

              // 提交事务
              connection.commit((err) => {
                if (err) {
                  console.error('提交事务失败:', err);
                  return connection.rollback(() => {
                    connection.release();
                    res.json({
                      code: 1,
                      message: '退房失败，提交申请失败'
                    });
                  });
                }
                connection.release();
                sql = 'UPDATE settings SET totalCost = 0 WHERE roomId = ?';
                pool.query(sql, [roomId], (err) => {
                  if (err) {
                    console.error('更新总费用失败:', err);
                    return res.json({
                      code: 1,
                      message: '退房失败，更新总费用失败'
                    });
                  }
                  return res.json({
                  code: 0,
                  message: '退房成功'
                });
                });
              });
            });
          });
        });
      });
    });
  });
});


/**** 3.4 开具详单接口****/
app.get('/stage/record', (req, res) => {
  // 从请求参数中获取 roomId
  const roomId = req.query.roomId;
  if (!roomId) {
    return res.json({
      code: 1,
      message: '未提供房间号',
      data: null
    });
  }

  // 1.从 rooms 表中获取 checkInTime 和 cost
  const sqlGetRoom = 'SELECT * FROM rooms WHERE roomId = ?';
  pool.query(sqlGetRoom, [roomId], (err, roomResult) => {
    if (err) {
      console.error('获取房间信息失败:', err);
      return res.json({
        code: 1,
        message: '查询失败',
        data: null
      });
    }

    // 2.从 roomPeople 表中获取 people 信息
    const sqlGetPeople = `
      SELECT p.peopleId, p.peopleName
      FROM roomPeople rp
      LEFT JOIN people p ON rp.peopleId = p.peopleId
      WHERE rp.roomId = ?
    `;
    pool.query(sqlGetPeople, [roomId], (err, peopleResult) => {
      if (err) {
        console.error('获取入住人员信息失败:', err);
        return res.json({
          code: 1,
          message: '查询失败',
          data: null
        });
      }

      // 3.从 aircon_history 表中获取 records 信息 只获取在入住时间之后的记录
      const sqlGetRecords = `SELECT * FROM aircon_history WHERE roomId = ? AND time > (SELECT checkInTime FROM rooms WHERE roomId = ?)`;
      pool.query(sqlGetRecords, [roomId, roomId], (err, recordsResult) => {
        if (err) {
          console.error('获取空调历史信息失败:', err);
          return res.json({
            code: 1,
            message: err,
            data: null
          });
        }

        // 处理数据
        // 将time字段转换为前端需要的格式 'YYYY-MM-DDTHH:mm:ss'
        recordsResult.forEach(record => {
          record.time = moment(record.time).format('YYYY-MM-DDTHH:mm:ss');
        });
        const data = {
          cost: roomResult[0].cost,
          people: peopleResult,
          records: recordsResult.map(record => ({
            time: record.time,
            cost: record.cost,
            power: record.power,
            temperature: record.temperature,
            windSpeed: record.windSpeed,
            mode: record.mode,
            sweep: record.sweep
          }))
        };
        return res.json({
          code: 0,
          message: '查询成功',
          data
        });
      });
    });
  });
});


/**** 4.1 中央空调设置 ****/
app.post('/central-aircon/adjust', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }

  let { mode, resourceLimit, fanRates } = req.body;
  const { lowSpeedRate, midSpeedRate, highSpeedRate } = fanRates;
  //mode=0 制冷 mode=1 制热
  if (mode === 0) {
    mode = '制冷';
  } else if (mode === 1) {
    mode = '制热';
  }
  const sql = 'UPDATE central_settings SET mode = ?, resourceLimit = ?, lowSpeedRate = ?, midSpeedRate = ?, highSpeedRate = ?';
  pool.query(sql, [mode, resourceLimit, lowSpeedRate, midSpeedRate, highSpeedRate], (err) => {
    if (err) {
      return res.json({
        code: 1,
        message: '设置失败, 请检查参数是否正确'
      });
    }
    return res.json({
      code: 0,
      message: '设置成功'
    });
  });
});


/**** 4.2 获取所有房间的详细信息（包括空调设置） ****/
app.get('/aircon/status', (req, res) => {
  const sql = `
    SELECT 
      r.roomId,
      r.checkedIn,
      r.checkInTime,
      s.roomTemperature,
      s.power,
      s.setTemperature,
      s.windSpeed,
      s.mode,
      s.sweep,
      s.cost,
      s.totalCost
    FROM rooms r
    LEFT JOIN settings s ON r.roomId = s.roomId
    ORDER BY r.roomId`;

  pool.query(sql, (err, result) => {
    if (err) {
      console.error('获取房间数据失败:', err);
      return res.json({
        code: 500,
        message: '获取房间数据失败',
        data: null
      });
    }

    try {
      // 处理数据，确保数值类型正确，并格式化输出
      const processedResult = result.map(room => ({
        roomId: room.roomId,
        roomTemperature: room.roomTemperature,
        power: room.power || 'off',
        temperature: room.temperature || 26,
        windSpeed: room.windSpeed || '低',
        mode: room.mode || '制冷',
        sweep: room.sweep || '关',
        cost: Number(room.cost || 0),
        totalCost: Number(room.totalCost || 0),
        checkedIn: room.checkedIn
      }));

      res.json({
        code: 0,
        message: '查询成功',
        data: processedResult
      });
    } catch (processError) {
      console.error('处理房间数据失败:', processError);
      res.json({
        code: 500,
        message: '处理房间数据失败',
        data: null
      });
    }
  });
});

/**** 5.1 获取近一周空调操作记录 ****/
app.get('/admin/query_ac', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }

  const electricFee = 1; // 每度电的费用
  let time = moment().format('YYYY-MM-DD HH:mm:ss');
  const sql = `SELECT * FROM aircon_history WHERE time > DATE_SUB(?, INTERVAL 1 WEEK) ORDER BY time DESC`;
  pool.query(sql, [time], (err, result) => {
    if (err) {
      console.error('获取空调操作记录失败:', err);
      return res.json({
        code: 1,
        message: '获取空调操作记录失败',
        data: null
      });
    }

    try {
      // 处理数据，确保数值类型正确，并格式化输出
      const processedResult = result.map(record => {
        // 计算费用
        const cost = record.cost * electricFee;
        // 把time字段转换为前端需要的格式 'YYYY-MM-DDTHH:mm:ss'
        record.time = moment(record.time).format('YYYY-MM-DDTHH:mm:ss');

        return {
          roomId: record.roomId,
          time: record.time,
          cost: cost,
          energyCost: record.cost,
          power: record.power,
          temperature: record.temperature,
          windSpeed: record.windSpeed,
          mode: record.mode,
          sweep: record.sweep,
          status: '等待', // 未实现
          timeSlice: 0 // 未实现
        };
      });
      res.json({
        code: 0,
        message: '查询成功',
        data: processedResult
      });
    } catch (processError) {
      console.error('处理空调操作记录失败:', processError);
      res.json({
        code: 1,
        message: '处理空调操作记录失败',
        data: null
      });
    }
  });
});

/**** 5.2 获取近一周调度记录 ****/
app.get('/admin/query_schedule', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }

  // 查询schedule_history表中近一周数据，如果startTime存在，则以startTime为该item的时间；如果startTime为NULL，则以requestTime为该item的时间；对相同的时间进行Group，每个时间Group计算一个{waitingQueue, runningQueue}, 即从该Group的每一个元素获取status，如果为waiting，则将该元素的roomId加入waitingQueue，如果为running，则将该元素的roomId加入runningQueue
  let time = moment().format('YYYY-MM-DD HH:mm:ss');
  const sql = `
    SELECT *
    FROM (
      SELECT 
        roomId, 
        status, 
        COALESCE(start_time, requestTime) AS time
      FROM schedule_history
    ) AS subquery
    WHERE time > DATE_SUB(?, INTERVAL 1 WEEK)
    ORDER BY time DESC;
  `;

  pool.query(sql, [time], (err, result) => {
    if (err) {
      console.error('获取调度记录失败:', err);
      return res.json({
        code: 1,
        message: '获取调度记录失败',
        data: null
      });
    }

    const groupedData = result.reduce((acc, item) => {
      const time = item.time;
      if (!acc[time]) {
        acc[time] = { waitingQueue: [], runningQueue: [] };
      }
      if (item.status === 'waiting') {
        acc[time].waitingQueue.push(item.roomId);
      } else if (item.status === 'running') {
        acc[time].runningQueue.push(item.roomId);
      }
      return acc;
    }, {});

    res.json({
      code: 0,
      message: '查询成功',
      data: Object.keys(groupedData).map(time => ({
        time,
        waitingQueue: groupedData[time].waitingQueue,
        runningQueue: groupedData[time].runningQueue
      }))
    });
  });
});

/**** 5.3 获取近一周客流记录 ****/
app.get('/admin/query_people', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }

  let time = moment().format('YYYY-MM-DD HH:mm:ss');
  const sql = `SELECT * FROM checkin_history WHERE checkInTime > DATE_SUB(?, INTERVAL 1 WEEK) ORDER BY checkInTime DESC`;
  pool.query(sql, [time], (err, result) => {
    if (err) {
      console.error('获取客流记录失败:', err);
      return res.json({
        code: 1,
        message: '获取客流记录失败',
        data: null
      });
    }

  const processedResult = result.map(record => (
    record.checkOutTime === null ? {
      time: moment(record.checkInTime).format('YYYY-MM-DD HH:mm:ss'),
      roomId: record.roomId,
      operation: '入住'
    } : {
      time: moment(record.checkOutTime).format('YYYY-MM-DD HH:mm:ss'),
      roomId: record.roomId,
      operation: '离开'
    }
  ));
  return res.json({
    code: 0,
    message: '查询成功',
    data: processedResult
  });
  });
});

/**** 5.4 获取各房间信息接口 ****/
app.post('/admin/query_room', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
        code: 1,
        message: '未提供有效的 Authorization 头',
        data: null
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    if (decoded.role === '房间') {
        return res.json({
            code: 1,
            message: '无权限',
        });
    }
  } catch(err){
    return res.json({
      code: 1,
      message: '无效的token',
  });
  }

// 1. 查询rooms表
const sql = 'SELECT * FROM rooms';
pool.query(sql, (err, rooms) => {
  if (err) {
    console.error('获取房间数据失败:', err);
    return res.json({
      code: 1,
      message: '获取房间数据失败',
      data: null
    });
  }

  // 2. 查询roomPeople表
  const sql2 = `
    SELECT rp.roomId, p.peopleId, p.peopleName
    FROM roomPeople rp
    LEFT JOIN people p ON rp.peopleId = p.peopleId
  `;
  pool.query(sql2, (err, roomPeople) => {
    if (err) {
      console.error('获取入住人员数据失败:', err);
      return res.json({
        code: 1,
        message: '获取入住人员数据失败',
        data: null
      });
    }

    // 3. 查询settings表
    const sql3 = 'SELECT * FROM settings';
    pool.query(sql3, (err, settings) => {
      if (err) {
        console.error('获取空调设置数据失败:', err);
        return res.json({
          code: 1,
          message: '获取空调设置数据失败',
          data: null
        });
      }

      // 4. 处理数据
      const data = rooms.map(room => {
        const roomPeopleList = roomPeople
          .filter(item => item.roomId === room.roomId)
          .map(item => ({
            peopleId: item.peopleId,
            peopleName: item.peopleName
          }));

        const setting = settings.find(item => item.roomId === room.roomId);

        return {
          roomId: room.roomId,
          roomLevel: room.roomLevel,
          people: roomPeopleList,
          cost: room.cost,
          roomTemperature: setting.roomTemperature,
          power: setting.power,
          temperature: setting.temperature,
          windSpeed: setting.windSpeed,
          mode: setting.mode,
          sweep: setting.sweep
        };
      });

      res.json({
        code: 0,
        message: '查询成功',
        data
      });
    });
  });
});

});


app.listen(PORT, Host, () => {
  console.log(`Server is running on http://${Host}:${PORT}`);
  
  // 启动调度器
  // scheduler.start(pool);
});