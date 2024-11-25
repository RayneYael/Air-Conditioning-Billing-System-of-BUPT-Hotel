const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({
  path: './.env'
});
const moment = require('moment');
const express = require('express')
const mysql = require('mysql')
const cors = require('cors')

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

// 判断函数，防止注入sql关键字导致系统奔溃
const sqlKeywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "EXEC", "UNION", "GRANT", "REVOKE"];

function containsSQLKeywords(input) {
  const uppercasedInput = input.toUpperCase(); // 将输入转换为大写
  const regex = new RegExp(`\\b(${sqlKeywords.join("|")})\\b`, "i");
  return regex.test(uppercasedInput);
}

app.post('/api/login', (req, res) => {
  try {
    const {
      username,
      password
    } = req.body;
    if (containsSQLKeywords(username) || containsSQLKeywords(password)) {
      return res.status(400).json({
        error: '用户名或密码不应包含SQL关键字,请换一个试试'
      });
    }
    pool.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
      if (error) {
        console.error('数据库拉取数据失败', error);
        return res.status(500).json({
          error: '数据库拉取数据失败,请检查网络'
        });
      } else {
        if (results.length === 0) {
          return res.status(400).json({
            error: "房间号/id不存在"
          });
        }

        const user = results[0];

        if (user.password !== password) {
          return res.status(400).json({
            error: "密码错误"
          });
        }

        const token = jwt.sign({
          userId: username
        }, jwtSecretKey, {
          expiresIn: '1h'
        });
        return res.status(200).json({
          message: "登录成功",
          token: token,
          username: username,
          role: user.role
        });
      }
    });
  } catch (error) {
    console.error('未知错误，请联系前台工作人员：', error);
    res.status(500).json({
      error: '未知错误，请联系前台工作人员'
    });
  }
});

// 获取当前房间设置 (GET)，通过房间号 roomId 作为参数
app.get('/api/controlPanelSettings', (req, res) => {
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
        code: 500,
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
          temperature: result[0].temperature,
          windSpeed: result[0].windSpeed,
          mode: result[0].mode,
          sweep: result[0].sweep,
          cost: Number(result[0].cost).toFixed(2), // 确保cost保留两位小数
          totalCost: Number(result[0].totalCost).toFixed(2) // 确保totalCost保留两位小数
        }
      });
    } else {
      // 未找到房间设置
      return res.json({
        code: 404,
        message: '未找到该房间的设置',
        data: null
      });
    }
  });
});

// 上传当前设置并记录历史
app.post('/api/controlPanelSettings', (req, res) => {
  const {
    roomId,
    ...newSettings
  } = req.body; // 从请求体中解构获取 roomId 和其他设置

  // 验证 roomId 是否存在
  if (!roomId) {
    return res.json({
      code: 400,
      message: '缺少房间号',
      data: null
    });
  }

  // 构建动态 SQL 更新语句
  let updateFields = [];
  let updateValues = [];
  let changedSettingEntries = []; // 用于记录字段变化的字符串

  // 遍历 newSettings，动态构建 SQL SET 部分和记录变更字段
  Object.keys(newSettings).forEach((key) => {
    updateFields.push(`${key} = ?`);
    updateValues.push(newSettings[key]);
    changedSettingEntries.push(`${key}: ${newSettings[key]}`);
  });

  // 如果没有传递任何字段，直接返回错误
  if (updateFields.length === 0) {
    return res.json({
      code: 400,
      message: '没有任何字段需要更新',
      data: null
    });
  }

  // 添加 roomId 到 SQL WHERE 子句
  updateValues.push(roomId);

  // 构建最终 SQL 语句
  const sqlUpdateSettings = `
    UPDATE settings
    SET ${updateFields.join(', ')}
    WHERE roomId = ?
  `;

  // 执行更新设置
  pool.query(sqlUpdateSettings, updateValues, (err) => {
    if (err) {
      console.error('更新设置失败:', err);
      return res.json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }

    // 记录设置更新的历史
    const startTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const costPerHour = newSettings.power === 'false' ? 0 : calculateCostPerHour(newSettings.windSpeed || '');
    const changedSetting = changedSettingEntries.join(', ');

    const sqlInsertHistory = `
      INSERT INTO settings_history (roomId, startTime, changedSetting, costPerHour)
      VALUES (?, ?, ?, ?)
    `;

    pool.query(sqlInsertHistory, [
      roomId,
      startTime,
      'power' in newSettings ? `power: ${newSettings['power']}` : changedSetting,
      costPerHour
    ], (err) => {
      if (err) {
        console.error('记录设置历史失败:', err);
        return res.json({
          code: 500,
          message: '记录历史时发生错误',
          data: null
        });
      }

      // 成功更新后返回标准格式的响应
      res.json({
        code: 0,
        message: '设置已更新并记录到历史',
        // data: {
        //   roomId,
        //   ...newSettings,
        //   updateTime: startTime,
        //   costPerHour
        // }
      });
    });
  });
});


app.get('/api/feeDetails/', (req, res) => {
  const roomId = req.params.roomId;

  const sql = 'SELECT * FROM settings_history WHERE roomId = ?';
  pool.query(sql, [roomId], (err, result) => {
    if (err) {
      console.error('获取费用详情失败:', err);
      return res.status(500).send('服务器错误');
    }

    // 如果没有数据，确保返回空数组
    res.json(result.length ? result : []);
  });
});

// 计算每小时费用的逻辑（根据模式、风速等）
function calculateCostPerHour(windSpeed) {
  let costPerHour = 5; // 基础费用
  if (windSpeed === '高') {
    costPerHour += 5; // 高风速增加额外费用
  } else if (windSpeed === '中') {
    costPerHour += 3; // 中风速增加额外费用
  }
  return costPerHour;
}

// 获取所有房间的数据
app.post('/api/rooms', (req, res) => {
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
      return res.status(500).json({
        code: 500,
        message: '获取房间数据失败',
        data: null
      });
    }

    try {
      // 处理每个房间的数据
      const processedResult = result.map(room => {
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

      res.json({
        code: 0,
        message: '查询成功',
        data: processedResult
      });
    } catch (processError) {
      console.error('处理房间数据失败:', processError);
      res.status(500).json({
        code: 500,
        message: '处理房间数据失败',
        data: null
      });
    }
  });
});



app.get('/api/settings', (req, res) => {
  const sql = 'SELECT * FROM settings'; // 查询所有房间设置数据
  pool.query(sql, (err, result) => {
    if (err) {
      console.error('获取设置数据失败:', err);
      return res.status(500).send('获取设置数据失败');
    }
    res.json(result); // 返回查询结果
  });
});

app.post('/api/checkIn', (req, res) => {
  const {
    roomId,
    peopleName
  } = req.body;

  // 参数验证
  if (!roomId || !peopleName) {
    return res.json({
      code: 400,
      message: '房间号和顾客姓名不能为空'
    });
  }

  // 1. 清空该房间的 settings_history 记录
  const sqlDeleteHistory = 'DELETE FROM settings_history WHERE roomId = ?';
  pool.query(sqlDeleteHistory, [roomId], (err) => {
    if (err) {
      console.error('清空历史记录失败:', err);
      return res.json({
        code: 500,
        message: '清空历史记录失败'
      });
    }

    // 2. 插入顾客信息到 people 表
    const sqlInsertPeople = 'INSERT INTO people (peopleName) VALUES (?)';
    pool.query(sqlInsertPeople, [peopleName], (err, peopleResult) => {
      if (err) {
        console.error('添加顾客信息失败:', err);
        return res.json({
          code: 500,
          message: '添加顾客信息失败'
        });
      }

      const peopleId = peopleResult.insertId;

      // 3. 在 roomPeople 表中建立关联
      const sqlInsertRoomPeople = 'INSERT INTO roomPeople (roomId, peopleId) VALUES (?, ?)';
      pool.query(sqlInsertRoomPeople, [roomId, peopleId], (err) => {
        if (err) {
          console.error('建立房间顾客关联失败:', err);
          return res.json({
            code: 500,
            message: '建立房间顾客关联失败'
          });
        }

        // 4. 更新 rooms 表的入住状态
        const sqlUpdateRoom = `
          UPDATE rooms 
          SET checkInTime = NOW(),
              checkedIn = 1 
          WHERE roomId = ?`;

        pool.query(sqlUpdateRoom, [roomId], (err) => {
          if (err) {
            console.error('更新房间状态失败:', err);
            return res.json({
              code: 500,
              message: '更新房间状态失败'
            });
          }

          res.json({
            code: 0,
            message: '顾客添加成功'
          });
        });
      });
    });
  });
});


app.get('/api/checkout', (req, res) => {
  const roomId = req.query.roomId;

  // 参数验证
  if (!roomId) {
    return res.json({
      code: 400,
      message: '房间号不能为空'
    });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('获取数据库连接失败:', err);
      return res.json({
        code: 500,
        message: '服务器错误'
      });
    }

    // 开启事务
    connection.beginTransaction((err) => {
      if (err) {
        console.error('开启事务失败:', err);
        connection.release();
        return res.json({
          code: 500,
          message: '服务器错误'
        });
      }

      // 1. 获取费用详情
      const sqlGetFeeDetails = 'SELECT * FROM settings_history WHERE roomId = ?';
      connection.query(sqlGetFeeDetails, [roomId], (err, feeDetails) => {
        if (err) {
          console.error('获取费用详情失败:', err);
          return connection.rollback(() => {
            connection.release();
            res.json({
              code: 500,
              message: '获取费用详情失败'
            });
          });
        }

        // 2. 删除该房间的 settings_history 记录
        const sqlDeleteHistory = 'DELETE FROM settings_history WHERE roomId = ?';
        connection.query(sqlDeleteHistory, [roomId], (err) => {
          if (err) {
            console.error('删除费用记录失败:', err);
            return connection.rollback(() => {
              connection.release();
              res.json({
                code: 500,
                message: '删除费用记录失败'
              });
            });
          }

          // 3. 删除房间人员关联记录
          const sqlDeleteRoomPeople = 'DELETE FROM roomPeople WHERE roomId = ?';
          connection.query(sqlDeleteRoomPeople, [roomId], (err) => {
            if (err) {
              console.error('删除房间顾客关联失败:', err);
              return connection.rollback(() => {
                connection.release();
                res.json({
                  code: 500,
                  message: '删除房间顾客关联失败'
                });
              });
            }

            // 4. 更新房间状态
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
                    code: 500,
                    message: '更新房间状态失败'
                  });
                });
              }

              // 5. 更新空调设置为默认值
              const sqlUpdateSettings = `
                UPDATE settings 
                SET power = 'off',
                    temperature = 26,
                    windSpeed = '低',
                    mode = '制冷',
                    sweep = '关'
                WHERE roomId = ?`;

              connection.query(sqlUpdateSettings, [roomId], (err) => {
                if (err) {
                  console.error('更新空调状态失败:', err);
                  return connection.rollback(() => {
                    connection.release();
                    res.json({
                      code: 500,
                      message: '更新空调状态失败'
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
                        code: 500,
                        message: '提交事务失败'
                      });
                    });
                  }

                  connection.release();
                  res.json({
                    code: 0,
                    message: '退房成功',
                    feeDetails
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

// 获取所有房间的详细信息（包括空调设置）
app.post('/api/rooms/details', (req, res) => {
  const sql = `
    SELECT 
      r.roomId,
      r.checkedIn,
      r.checkInTime,
      s.roomTemperature,
      s.power,
      s.temperature,
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
        cost: Number(room.cost || 0).toFixed(2),
        totalCost: Number(room.totalCost || 0).toFixed(2),
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


// 定义获取费用详情的后端API
app.get('/api/calculateFee/:roomId', (req, res) => {
  const {
    roomId
  } = req.params;

  // 查询指定 roomId 的 settings_history 表中的数据
  pool.query('SELECT * FROM settings_history WHERE roomId = ?', [roomId], (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({
        error: '费用计算失败'
      });
    }

    if (!results || results.length === 0) {
      // 如果没有历史记录，直接返回 0
      return res.json({
        totalFee: 0,
        calculatedData: []
      });
    }

    let totalFee = 0;

    // 对每一条历史记录进行费用计算
    const calculatedData = results.map((current, index) => {
      const currentStartTime = moment(current.startTime);
      let nextStartTime;

      // 如果空调关闭，则当前阶段不计费
      const isAirConditionerOff = current.changedSetting.includes('power: false');
      if (isAirConditionerOff) {
        return {
          ...current,
          stageCost: 0, // 阶段费用为0
          costPerHour: 0, // 当空调关闭时，每小时费用为0
        };
      }

      // 获取下一个阶段的开始时间，或者使用当前时间作为结束时间
      if (results[index + 1]) {
        nextStartTime = moment(results[index + 1].startTime);
      } else {
        nextStartTime = moment(); // 使用当前时间
      }

      // 调用 calculateCostPerHour 来计算每小时费用
      const costPerHour = current.costPerHour

      // 计算该阶段的时间长度（以小时为单位）
      const durationInHours = nextStartTime.diff(currentStartTime, 'hours', true);

      // 计算该阶段的费用
      const stageCost = (durationInHours * costPerHour).toFixed(2);
      totalFee += parseFloat(stageCost); // 累计费用

      return {
        ...current,
        stageCost,
        costPerHour
      }; // 返回阶段费用和每小时费用
    });
    // 返回累计费用和详细的计算结果
    res.json({
      totalFee: totalFee.toFixed(2),
      calculatedData
    });
  });
});

app.listen(PORT, Host, () => {
  console.log(`Server is running on http://${Host}:${PORT}`);
});