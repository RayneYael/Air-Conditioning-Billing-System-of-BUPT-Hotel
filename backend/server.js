const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
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
    host: process.env.DB_HOST,        // 从环境变量中获取 MySQL 服务器地址
    user: process.env.DB_USER,        // 从环境变量中获取 MySQL 用户名
    password: process.env.DB_PASSWORD, // 从环境变量中获取 MySQL 密码
    database: process.env.DB_NAME,     // 从环境变量中获取数据库名
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 判断函数，防止注入sql关键字导致系统奔溃
const sqlKeywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "EXEC", "UNION", "GRANT", "REVOKE"];
function containsSQLKeywords(input) {
    const uppercasedInput = input.toUpperCase();  // 将输入转换为大写
    const regex = new RegExp(`\\b(${sqlKeywords.join("|")})\\b`, "i");
    return regex.test(uppercasedInput);
}

app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (containsSQLKeywords(username) || containsSQLKeywords(password)) {
            return res.status(400).json({ error: '用户名或密码不应包含SQL关键字,请换一个试试' });
        }
        pool.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
            if (error) {
                console.error('数据库拉取数据失败',error);
                return res.status(500).json({ error: '数据库拉取数据失败,请检查网络' });
            } else {
                if (results.length === 0) {
                    return res.status(400).json({ error: "房间号/id不存在" });
                }
    
                const user = results[0];
    
                if (user.password !== password) {
                    return res.status(400).json({ error: "密码错误" });
                }
                
                const token = jwt.sign({ userId: username }, jwtSecretKey, { expiresIn: '1h' });
                return res.status(200).json({ message: "登录成功" , token: token, username:username, role: user.role});
            }
        });
    } catch (error) {
        console.error('未知错误，请联系前台工作人员：',error);
        res.status(500).json({ error: '未知错误，请联系前台工作人员' });
    }
});

// 获取当前房间设置 (GET)，通过房间号 id 作为参数
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
  app.post('/api/controlPanelSettings/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const newSettings = req.body;

  // app.post('/api/controlPanelSettings', (req, res) => {
  //   const { roomId, ...newSettings } = req.body;  // 从请求体中解构出id和其他设置
    // 构建动态 SQL 更新语句
    let updateFields = [];
    let updateValues = [];
    let changedSettingEntries = []; // 用于记录字段变化的字符串
  
    // 遍历 newSettings，动态构建 SQL SET 部分和记录变更字段
    Object.keys(newSettings).forEach((key) => {
      updateFields.push(`${key} = ?`);
      updateValues.push(newSettings[key]);
  
      // 记录字段名和值，用于存储到历史表
      changedSettingEntries.push(`${key}: ${newSettings[key]}`);
    });
  
    // 如果没有传递任何字段，直接返回错误
    if (updateFields.length === 0) {
      return res.status(400).send('没有任何字段需要更新');
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
        return res.status(500).send('服务器错误');
      }
  
      // 记录设置更新的历史
      const startTime = moment().format('YYYY-MM-DD HH:mm:ss');
      const costPerHour = newSettings.isOn === ' false' ? 0 : calculateCostPerHour(newSettings.mode || '', newSettings.windSpeed || '') ; // 根据 mode 和 windSpeed 计算费用
      const changedSetting = changedSettingEntries.join(', '); // 将变化的字段和对应值以字符串形式记录
      
      const sqlInsertHistory = `
        INSERT INTO settings_history (roomId, startTime, changedSetting, costPerHour)
        VALUES (?, ?, ?, ?)
      `;
  
      pool.query(sqlInsertHistory, [
        roomId, 
        startTime, 
        'isOn' in newSettings ? `isOn: ${newSettings['isOn']}` : changedSetting, 
        costPerHour
      ], (err) => {
        if (err) {
          console.error('记录设置历史失败:', err);
          return res.status(500).send('记录历史时发生错误');
        }
      });
  
        res.send('设置已更新并记录到历史');
      });
    });
  

  app.get('/api/feeDetails/:roomId', (req, res) => {
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
function calculateCostPerHour(mode, windSpeed) {
    let costPerHour = 5; // 基础费用
    if (mode === 'strongCooling') {
      costPerHour = 10;
    } else if (mode === 'forcedHeating') {
      costPerHour = 8;
    }
    if (windSpeed === 'high') {
      costPerHour += 2; // 高风速增加额外费用
    }
    return costPerHour;
}

// 获取所有房间的数据
app.get('/api/rooms', (req, res) => {
  const sql = 'SELECT * FROM rooms';  // 查询所有房间数据
  pool.query(sql, (err, result) => {
    if (err) {
      console.error('获取房间数据失败:', err);
      return res.status(500).send('获取房间数据失败');
    }
    res.json(result);  // 返回查询结果
  });
});

app.get('/api/settings', (req, res) => {
  const sql = 'SELECT * FROM settings';  // 查询所有房间设置数据
  pool.query(sql, (err, result) => {
    if (err) {
      console.error('获取设置数据失败:', err);
      return res.status(500).send('获取设置数据失败');
    }
    res.json(result);  // 返回查询结果
  });
});

app.post('/api/checkin/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const { customerName, checkInTime } = req.body;

  // 1. 先清空该房间的 settings_history 记录
  const sqlDeleteHistory = 'DELETE FROM settings_history WHERE roomId = ?';
  pool.query(sqlDeleteHistory, [roomId], (err) => {
    if (err) {
      console.error('清空历史记录失败:', err);
      return res.status(500).send('清空历史记录时发生错误');
    }

    // 2. 清空成功后，再更新 rooms 表，办理入住
    const sqlCheckIn = 'UPDATE rooms SET customerName = ?, checkInTime = ?, checkedIn = 1 WHERE roomId = ?';
    pool.query(sqlCheckIn, [customerName, checkInTime, roomId], (err) => {
      if (err) {
        console.error('入住失败:', err);
        return res.status(500).send('办理入住时发生错误');
      }

      // 3. 最后返回成功信息
      res.send('入住成功');
    });
  });
});



app.post('/api/checkout/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  // 确保 roomId 为数字类型
  if (isNaN(roomId)) {
    return res.status(400).send('无效的房间号');
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('获取数据库连接失败:', err);
      return res.status(500).send('服务器错误');
    }
    // 开启mysql事务，保证数据完整性和一致性，防止数据部分提交
    connection.beginTransaction((err) => {
      if (err) {
        console.error('开启事务失败:', err);
        connection.release();
        return res.status(500).send('服务器错误');
      }

      // 1. 获取费用详情
      const sqlGetFeeDetails = 'SELECT * FROM settings_history WHERE roomId = ?';
      connection.query(sqlGetFeeDetails, [roomId], (err, feeDetails) => {
        if (err) {
          console.error('获取费用详情失败:', err);
          return connection.rollback(() => {
            connection.release();
            res.status(500).send('获取费用详情时发生错误');
          });
        }

        // 2. 删除 settings_history 中的对应记录
        const sqlDeleteHistory = 'DELETE FROM settings_history WHERE roomId = ?';
        connection.query(sqlDeleteHistory, [roomId], (err) => {
          if (err) {
            console.error('删除费用记录失败:', err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).send('删除费用记录时发生错误');
            });
          }

          // 3. 更新 rooms 表，将客户信息和空调费用置空
          const sqlUpdateRoom = 'UPDATE rooms SET customerName = NULL, checkInTime = NULL, airConditionerFee = 0, checkedIn = 0 WHERE roomId = ?';
          connection.query(sqlUpdateRoom, [roomId], (err) => {
            if (err) {
              console.error('重置房间状态失败:', err);
              return connection.rollback(() => {
                connection.release();
                res.status(500).send('重置房间状态时发生错误');
              });
            }

            // 4. 更新 settings 表，将空调状态设为默认值
            const sqlUpdateSettings = 'UPDATE settings SET power = "off", temperature = 26, windSpeed = "低", mode = "制冷", sweep = "关" WHERE roomId = ?';
            connection.query(sqlUpdateSettings, [roomId], (err) => {
              if (err) {
                console.error('更新空调状态失败:', err);
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).send('更新空调状态时发生错误');
                });
              }

              // 事务提交
              connection.commit((err) => {
                if (err) {
                  console.error('提交事务失败:', err);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).send('提交事务时发生错误');
                  });
                }

                // 退房成功后，返回费用详情供前端使用
                res.send({ message: '退房成功', feeDetails }); 
                connection.release();
              });
            });
          });
        });
      });
    });
  });
});

// 定义获取费用详情的后端API
app.get('/api/calculateFee/:roomId', (req, res) => {
  const { roomId } = req.params;

  // 查询指定 roomId 的 settings_history 表中的数据
  pool.query('SELECT * FROM settings_history WHERE roomId = ?', [roomId], (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ error: '费用计算失败' });
    }

    if (!results || results.length === 0) {
      // 如果没有历史记录，直接返回 0
      return res.json({ totalFee: 0, calculatedData: [] });
    }

    let totalFee = 0;

    // 对每一条历史记录进行费用计算
    const calculatedData = results.map((current, index) => {
      const currentStartTime = moment(current.startTime);
      let nextStartTime;

      // 如果空调关闭，则当前阶段不计费
      const isAirConditionerOff = current.changedSetting.includes('isOn: false');
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

      return { ...current, stageCost, costPerHour }; // 返回阶段费用和每小时费用
    });
    // 返回累计费用和详细的计算结果
    res.json({ totalFee: totalFee.toFixed(2), calculatedData });
  });
});

app.listen(PORT, Host, () => {
  console.log(`Server is running on http://${Host}:${PORT}`);
});