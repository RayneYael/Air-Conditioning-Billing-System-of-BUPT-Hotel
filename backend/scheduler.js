const moment = require("moment");
const None = null;





let runningQueue = []; // 当前运行的队列
let waitingQueue = { 高: [], 中: [], 低: [] }; // 等待队列,按风速优先级划分
let offQueue = []; // 房间开机，但调度结束后的队列，等待回温到初始温度后再次申请调度


// 制热
const Simulate_user_operation = [
    ['开机',None, None, None, None],
    ['24', '开机',None, None, None],
    [None, None, '开机', None, None],
    [None, '25', None, '开机', '开机'],
    [None, None, '27', None, '高'],
    ['高', None, None, None, None],
    [None, None, None, None, None],
    [None, None, None, None, '24'],
    [None, None, None, None, None],
    ['28', None, None, '28', '高'],
    [None, None, None, None, None],
    [None, None, None, None, '中'],
    [None, '高', None, None, None],
    [None, None, None, None, None],
    ['关机', None, '低', None, None],
    [None, None, None, None, None],
    [None, None, None, None, '关机'],
    [None, None, '高', None, None],
    ['开机', None, '25,中', None, None],
    [None, None, None, None, None],
    [None, '27,中', None, None, '开机'],
    [None, None, None, None, None],
    [None, None, None, None, None],
    [None, None, None, None, None],
    ['关机', None, '关机', None, '关机'],
    [None, '关机', None, '关机', None],
    [None, None, None, None, None]
]
function removeFromWaitingQueue(roomId) {
    for (let key in waitingQueue) {
        let index = waitingQueue[key].indexOf(roomId);
        if (index > -1) {
            waitingQueue[key].splice(index, 1);
        }
    }
}

// 插入等待队列
function insertWaitingQueue(windSpeed, roomId) {
    if (windSpeed === '高') {
        waitingQueue['高'].push(roomId);
    } else if (windSpeed === '中') {
        waitingQueue['中'].push(roomId);
    }
    else {
        waitingQueue['低'].push(roomId);
    }
}

// 处理用户操作, 处理由于用户操作引起的变化，特别是waitingQueue各优先级的移动，不负责runningQueue现有进程的移出移入操作
function ProcessUserOperation(task) {
    let task_type = task.task;
    let roomId = task.roomId;
    let windSpeed = task.wind_speed
    let mode = task.mode
    let targetTemperature = task.target_temp
    let roomTemperature = task.romeTemperature
    let time = task.request_time

    // 时间片长度为120s
    const newTimeSlice = 120; 
    // 插入操作应该放在最后

    if (task_type === '开机') {
        // 产生该房间的调度详单,更新数据库schedule_history中的roomId, requestTime, status(ENUM('waiting', 'running', 'off')), target_temp, current_temp, wind_speed, mode
        let sql = `INSERT INTO schedule_history (roomId, requestTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice) VALUES (${roomId}, '${time}', 'waiting', ${targetTemperature}, ${roomTemperature}, '${windSpeed}', '${mode}, ${newTimeSlice})`;
        pool.query(sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            
        });
    }
    
    if(task_type === '调风'){
        // 先找到该roomId所在的原有waitingQueue和RunningQueue，删除
        removeFromWaitingQueue(roomId);

        // 找到数据库schedule_history中该roomId的最近一条数据，如果statu为running，填写endTime为time，并计算startTime和endTime之差为duration
        let sql = `SELECT * FROM schedule_history WHERE roomId = ${roomId} ORDER BY requestTime DESC LIMIT 1`;
        pool.query(sql, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                let row = result[0];
                let history_id = row.id;
                if (row.status === 'running') {
                    let endTime = time;
                    let startTime = row.startTime;
                    let duration = moment.duration(moment(endTime).diff(moment(startTime))).asSeconds();
                    // 我觉得timeSlice不应该在这里处理
                    let remainTimeSlice = row.remainTimeSlice;
                    if (remainTimeSlice >= 60) {
                        remainTimeSlice -= 60;
                    }
                    let sql = `UPDATE schedule_history SET endTime = '${endTime}'  duration = ${duration} WHERE id = ${history_id}`;
                    pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        if (remainTimeSlice > 0) {
                            // 插入数据库schedule_history一条新数据，roomId, status(ENUM('waiting', 'running', 'off')), target_temp, current_temp, wind_speed, mode
                            sql = `INSERT INTO schedule_history (roomId, requestTime, startTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice) VALUES (${roomId}, '${time}', '${time}', 'running', ${targetTemperature}, ${roomTemperature}, '${windSpeed}', '${mode}, ${remainTimeSlice})`;
                            pool.query(sql, (err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
                } else if (row.status === 'waiting') {
                    let sql = `UPDATE schedule_history SET duration = 0 WHERE id = ${history_id}`;
                    pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        let sql = `INSERT INTO schedule_history (roomId, requestTime, status, duration = 0, target_temp, current_temp, wind_speed, mode, remainTimeSlice) VALUES (${roomId}, '${time}', 'waiting', 0, ${targetTemperature}, ${roomTemperature}, '${windSpeed}', '${mode}, ${newTimeSlice})`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                            insertWaitingQueue(windSpeed, roomId);
                        });
                    });
                }
            }
        });
    }
    
    
}

function update_database(pool, time) {
// 用电量：settings.cost == aircon_history.cost 当前当前设置下的用电量；
//         settings.totalCost == room.cost 当前房间的总用电量；
// 空调费用计算：每次调用时根据用电度数计算
// 住宿费用计算：每次关机模拟为一天，由aircon_history.power == 'off'的次数和central_settings中该房间单日费用计算

    //根据roomId（1，2，3，4，5）筛选开机（power=on）的，获取其风速 区分不同风速的用电量（高风速1度1分钟，中风速1度2分钟，低风速1度3分钟）
    let sql = `SELECT * FROM settings WHERE power = 'on'`;
    pool.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            result.forEach(row => {
                let roomId = row.roomId;
                let windSpeed = row.windSpeed;
                let cost = 0;
                let totalCost = row.totalCost;
                if (windSpeed === '高') {
                    cost = 1;
                } else if (windSpeed === '中') {
                    cost = 1/2;
                } else {
                    cost = 1/3;
                }
                totalCost += cost;
                let sql = `UPDATE settings SET cost = ${cost}, totalCost = ${totalCost} WHERE roomId = ${roomId}`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                });
                // 更新aircon_history表中该roomId最近一条记录的cost
                sql = `SELECT * FROM aircon_history WHERE roomId = ${roomId} ORDER BY time DESC LIMIT 1`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        let history_id = result[0].id;
                        let sql = `UPDATE aircon_history SET cost = ${cost} WHERE id = ${history_id}`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });

            });
        }
    });
    simulate_temperature_change(pool, time); // 模拟温度变化，并在数据库更新
}

// 每轮调度前
function handle_user_operation(pool, time) {

    let user_operation = Simulate_user_operation.shift()
    console.log('用户操作', user_operation)
    if(user_operation){
        
        let indices = [];
        // 由于房间号是2001-2005， 索引push前应该+2000 

        // 找到所有开机指令的位置
        let idx = user_operation.indexOf('开机');
        while (idx != -1) {
            idx += 2000;
            indices.push(idx);
            idx = user_operation.indexOf('开机', idx + 1);
        }
        if (indices.length > 0) {
            indices.forEach(index => {
                // 以index+1为roomId，从数据库settings表中读取相应init_settings、init_target_temperature、init_temp、init_wind_speed
                let roomId = index + 1;
                let sql = `SELECT roomTemperature, init_target_temperature, init_temp, init_wind_speed FROM settings WHERE roomId = ${roomId}`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        let init_target_temperature = result[0].setTemperature;
                        let init_temp = result[0].initTemperature; 
                        let init_wind_speed = result[0].windSpeed
                        let mode = result[0].mode;
                        let romeTemperature = result[0].roomTemperature;
    
                        // 根据风速 高风速优先级最高 放入相应waitingQueue
                        
                        let task = {
                            request_time: time, // 时间戳
                            wind_speed: init_wind_speed, // 缺省风速
                            mode: mode, // 缺省模式
                            init_temp: init_temp, // 房间默认要恢复到的起始温度
                            target_temp: init_target_temperature, // 目标温度
                            romeTemperature: romeTemperature,  // 房间当前温度
                            roomId: roomId,
                            task: '开机'
                        };
                        // 在settings中更新power为on
                        let sql = `UPDATE settings SET power = 'on' WHERE roomId = ${roomId}`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                        console.log('用户操作', task);
                        ProcessUserOperation(task);
                    }
                });
            });
        }

        // 找到所有关机指令的位置
        indices = [];
        idx = user_operation.indexOf('关机');
        while (idx != -1) {
            idx += 2000;
            indices.push(idx);
            idx = user_operation.indexOf('关机', idx + 1);
        }
        if (indices.length > 0) {
            indices.forEach(index => {
                let roomId = index + 1;
                // 更新settings中power为off
                let sql = `UPDATE settings SET power = 'off' WHERE roomId = ${roomId}`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                });
                // 插入schedule_history中该roomId的一条数据，status为NULL, duration为0, requestTime为time
                sql = `INSERT INTO schedule_history (roomId, requestTime, status, duration = 0) VALUES (${roomId}, '${time}', NULL, 0)`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                });
                // 移出所有队列
                removeFromWaitingQueue(roomId);
                runningQueue.splice(runningQueue.indexOf(roomId), 1);
                offQueue.splice(offQueue.indexOf(roomId), 1);
            });
        
        }

        // 找到所有调整风速和温度的指令， 注意， 有些item可能是“温度，风速”或“风速，温度”这种组合, 先排除None，再识别能否通过逗号分割，数字为温度，（高，中，低）为风速，分布放入不同indices列表
        indices_temp = [];
        indices_wind = [];
        for (let i = 0; i < user_operation.length; i++) {
            if (user_operation[i] != None) {
                if (user_operation[i].includes(',')) {
                    let temp_wind = user_operation[i].split(',');
                    if (temp_wind[0] in ['高', '中', '低']) {
                        i += 2000;
                        indices_wind.push(i);
                    }
                    else {
                        i += 2000;
                        indices_temp.push(i);
                    }
                }
                else {
                    if (user_operation[i] in ['高', '中', '低']) {
                        i += 2000;
                        indices_wind.push(i);
                    }
                    else {
                        i += 2000;
                        indices_temp.push(i);
                    }
                }
            }
        }
        // 处理调风指令
        if (indices_wind.length > 0) {
            indices_wind.forEach(index => {
                let roomId = index + 1;
                let sql = `SELECT windSpeed FROM settings WHERE roomId = ${roomId}`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        let wind_speed = result[0].windSpeed;
                        let mode = result[0].mode;
                        let romeTemperature = result[0].roomTemperature;
                        let init_temp = result[0].initTemperature;
                        let init_target_temperature = result[0].setTemperature;
                        
                        let task = {
                            request_time: time, // 时间戳
                            wind_speed: wind_speed, // 缺省风速
                            mode: mode, // 缺省模式
                            init_temp: init_temp, // 房间默认要恢复到的起始温度
                            target_temp: init_target_temperature, // 目标温度
                            romeTemperature: romeTemperature,  // 房间当前温度
                            roomId: roomId,
                            task: '调风'
                        };
                        // 在settings中更新windSpeed
                        let sql = `UPDATE settings SET windSpeed = '${user_operation[index]}' WHERE roomId = ${roomId}`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                        console.log('用户操作', task);
                        ProcessUserOperation(task);
                    }
                });
            });
        }
        // 处理调温指令
        if (indices_temp.length > 0) {
            indices_temp.forEach(index => {
                let roomId = index + 1;
                let sql = `UPDATE settings SET setTemperature = ${indices_temp[index]} WHERE roomId = ${roomId}`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    // 修改schedule_history中该roomId最近一条数据的target_temp
                    let sql = `UPDATE schedule_history SET target_temp = ${indices_temp[index]} WHERE roomId = ${roomId} ORDER BY requestTime DESC LIMIT 1`;
                    pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
                
            });
        }
        // 将用户空调更新记录插入aircon_history表，包含roomId, time, power, temperature, wind_speed, mode)
        let sql = `SELECT * FROM settings`;
        pool.query(sql, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                result.forEach(row => {
                    let roomId = row.roomId;
                    let power = row.power;
                    let temperature = row.roomTemperature;
                    let wind_speed = row.windSpeed;
                    let mode = row.mode;
                    let sql = `INSERT INTO aircon_history (roomId, time, power, temperature, wind_speed, mode) VALUES (${roomId}, '${time}', '${power}', ${temperature}, '${wind_speed}', '${mode}')`;
                    pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
            }
        });
        
    }
}

function simulate_temperature_change(pool, time){
    // 在running的温度改变0.5(升高还是降低取决于mode) statue为off的回温0.5(直到回到init_temp)
    if (runningQueue.length > 0) {
        runningQueue.forEach(roomId => {
            let sql = `SELECT * FROM settings WHERE roomId = ${roomId}`;
            pool.query(sql, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    let row = result[0];
                    let current_temp = row.roomTemperature;
                    let init_temp = row.initTemperature;
                    let mode = row.mode;
                    let target_temp = row.setTemperature;
                    let wind_speed = row.windSpeed;
                    let new_temp = current_temp;
                    if (mode === 'cold') {
                        new_temp -= 0.5;
                    } else {
                        new_temp += 0.5;
                    }
                    // 更新上一条schedule_history的endTime和duration
                    let sql = `SELECT * FROM schedule_history WHERE roomId = ${roomId} ORDER BY requestTime DESC LIMIT 1`;
                    pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            let row = result[0];
                            let history_id = row.id;
                            let endTime = time;
                            let startTime = row.startTime;
                            let duration = moment.duration(moment(endTime).diff(moment(startTime))).asSeconds();
                            let sql = `UPDATE schedule_history SET endTime = '${time}', duration = ${duration} WHERE id = ${history_id}`;
                            pool.query(sql, (err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                                // 修改settings中该roomId的roomTemperature为new_temp
                                sql = `UPDATE settings SET roomTemperature = ${new_temp} WHERE roomId = ${roomId}`;
                                pool.query(sql, (err, result) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            });
                        }
                    });

                    if (new_temp === target_temp) {
                        // 插入schedule_history中该roomId的一条数据，status为off
                        sql = `INSERT INTO schedule_history (roomId, requestTime, status, duration = 0, target_temp, current_temp, wind_speed, mode) VALUES (${roomId}, '${time}', 'off', 0, ${target_temp}, ${new_temp}, '${wind_speed}', '${mode}')`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                        // 移出runningQueue，插入offQueue
                        runningQueue.splice(runningQueue.indexOf(roomId), 1);
                        offQueue.push(roomId);
                    } 
                }
            });
        });
    }
    if (offQueue.length > 0) {
        offQueue.forEach(roomId => {
            let sql = `SELECT * FROM settings WHERE roomId = ${roomId}`;
            pool.query(sql, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    let row = result[0];
                    let current_temp = row.roomTemperature;
                    let init_temp = row.initTemperature;
                    let mode = row.mode;
                    let target_temp = row.setTemperature;
                    let wind_speed = row.windSpeed;
                    let new_temp = current_temp;
                    if (current_temp < init_temp) {
                        new_temp += 0.5;
                    } else if (current_temp > init_temp) {
                        new_temp -= 0.5;
                    }
                    // 修改settings中该roomId的roomTemperature为new_temp
                    let sql = `UPDATE settings SET roomTemperature = ${new_temp} WHERE roomId = ${roomId}`;
                    pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    if (new_temp === init_temp) {
                        // 插入schedule_history中该roomId的一条数据的status为waiting
                        sql = `INSERT INTO schedule_history (roomId, requestTime, status, duration = 0, target_temp, current_temp, wind_speed, mode) VALUES (${roomId}, '${time}', 'waiting', 0, ${target_temp}, ${new_temp}, '${wind_speed}', '${mode}')`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                            // 移出offQueue，放入waitingQueue
                            offQueue.splice(offQueue.indexOf(roomId), 1);
                            insertWaitingQueue(wind_speed, roomId);
                        });
                    }
                }
            });
        });
    }

}

function handle_runningQueue_TimeSlice(pool, time) {
    // 遍历runningQueue每个对象，查询数据库schedule_history中该roomId的最近一条数据，如果remainTimeSlice为0，更新改行endTime和duration，再插入一条新数据（statue变为waitting），如果remainTimeSlice不为0，对其-60
    if (runningQueue.length > 0) {
        runningQueue.forEach(roomId => {
            let sql = `SELECT * FROM schedule_history WHERE roomId = ${roomId} ORDER BY requestTime DESC LIMIT 1`;
            pool.query(sql, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    let row = result[0];
                    let history_id = row.id;
                    let remainTimeSlice = row.remainTimeSlice;
                    let endTime = time;
                    let startTime = row.startTime;
                    let duration = moment.duration(moment(endTime).diff(moment(startTime))).asSeconds();
                    if (remainTimeSlice === 0) {
                        // 移出runningQueue，放入waitingQueue
                        runningQueue.splice(runningQueue.indexOf(roomId), 1);
                        insertWaitingQueue(row.wind_speed, roomId);
                        let sql = `UPDATE schedule_history SET endTime = '${time}', duration = ${duration} WHERE id = ${history_id}`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                            // 插入一条新数据
                            // requestTime是上一条该roomId的Schedule_history的requestTime
                            let sql = `SELECT * FROM schedule_history WHERE roomId = ${roomId} ORDER BY requestTime DESC LIMIT 1`;
                            pool.query(sql, (err, result) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    let row = result[0];
                                    let requestTime = row.requestTime;
                                    let sql = `INSERT INTO schedule_history (roomId, requestTime, startTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice) VALUES (${roomId}, ${requestTime}, '${time}', 'waiting', ${row.target_temp}, ${row.current_temp}, '${row.wind_speed}', '${row.mode}', ${120})`;
                                    pool.query(sql, (err, result) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        remainTimeSlice -= 60;
                        let sql = `UPDATE schedule_history SET remainTimeSlice = ${remainTimeSlice} WHERE id = ${history_id}`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                }
            });
        });
    }
}

function schedule(pool, time) {
    // 读取数据库central_settings中的resourceLimit数
    let sql = `SELECT resourceLimit FROM central_settings`;
    pool.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            let resourceLimit = result[0].resourceLimit;
            let runningQueueLength = runningQueue.length;
            // 计算可用资源数， 从waitingQueue按优先级取出资源，放入runningQueue
            for (i=0; i < resourceLimit - runningQueueLength; i++) {
                if (waitingQueue['高'].length > 0) {
                    let roomId = waitingQueue['高'].shift();
                    runningQueue.push(roomId);
                } else if (waitingQueue['中'].length > 0) {
                    let roomId = waitingQueue['中'].shift();
                    runningQueue.push(roomId);
                } else if (waitingQueue['低'].length > 0) {
                    let roomId = waitingQueue['低'].shift();
                    runningQueue.push(roomId);
                }
                // 插入schedule_history中该roomId的一条数据，status为running
                let sql = `SELECT * FROM settings WHERE roomId = ${roomId}`;
                pool.query(sql, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        let row = result[0];
                        let current_temp = row.roomTemperature;
                        let init_temp = row.initTemperature;
                        let mode = row.mode;
                        let target_temp = row.setTemperature;
                        let wind_speed = row.windSpeed;
                        let remainTimeSlice = row.remainTimeSlice;
                        // requestTime是上一条该roomId的Schedule_history的requestTime
                        let sql = `SELECT * FROM schedule_history WHERE roomId = ${roomId} ORDER BY requestTime DESC LIMIT 1`;
                        pool.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                let row = result[0];
                                let requestTime = row.requestTime;
                                let sql = `INSERT INTO schedule_history (roomId, requestTime, startTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice) VALUES (${roomId}, ${requestTime}, '${time}', 'running', ${target_temp}, ${current_temp}, '${wind_speed}', '${mode}', ${remainTimeSlice})`;
                                pool.query(sql, (err, result) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });  
}

// 需补充数据库cost条目 区分不同风速的用电量（高风速1度1分钟，中风速1度2分钟，低风速1度3分钟）

function startScheduler(pool) {
  console.log("Scheduler started...");
  let time = '2024-11-25T00:00:00'.format('YYYY-MM-DDTHH:mm:ss');
  setInterval(() => {

    // 为了调试时10s表示1分钟， 设置第一次调度时间为2024-01-01 00:00:00 ISO 8601格式， 后每次调度加一分钟
    
    time = moment(time).add(1, 'minutes').format('YYYY-MM-DDTHH:mm:ss');


    
    console.log('step1:获取当前时间', time);
    handle_user_operation(pool, time); // 处理每次调度前的用户操作
    console.log('step2:处理用户操作');
    handle_runningQueue_TimeSlice(pool, time); // 处理runninigQueue对象的去留问题（根据剩余时间片）
    console.log('step3:处理runningQueue, 准备开始调度');
    // 输出各个队列的情况
    console.log('runningQueue:', runningQueue);
    console.log('waitingQueue:', waitingQueue);
    console.log('offQueue:', offQueue);
    schedule(pool, time); // 调度（根据当前情况，从waitingQueue中取出资源放入runningQueue）
    console.log('step4:调度结束');
    update_database(pool, time); // 模拟运行后的各类更新
    console.log('step5:更新数据库');
  }, 60000); // 10s
}

// 导出函数供主程序调用
module.exports = {
  start: startScheduler,
};


