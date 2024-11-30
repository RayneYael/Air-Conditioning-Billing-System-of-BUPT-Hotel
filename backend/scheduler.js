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
    ['28', None, None, '28,高', None],
    [None, None, None, None, None],
    [None, None, None, None, '中'],
    [None, '高', None, None, None],
    [None, None, None, None, None],
    ['关机', None, '低', None, None],
    [None, None, None, None, None],
    [None, None, None, None, '关机'],
    [None, None, '高', None, None],
    ['开机', None, None, '25,中', None],
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
async function ProcessUserOperation(task, pool) {
    const queryDatabase = (sql, params = []) =>
        new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

    const { task: task_type, roomId, wind_speed, mode, target_temp, romeTemperature, request_time } = task;

    // 时间片长度为 120s
    const newTimeSlice = 120;

    try {
        if (task_type === '开机') {
            // 插入调度详单到 schedule_history
            const sqlInsertSchedule = `
                INSERT INTO schedule_history (roomId, requestTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice)
                VALUES (?, ?, 'waiting', ?, ?, ?, ?, ?)
            `;
            await queryDatabase(sqlInsertSchedule, [roomId, request_time, target_temp, romeTemperature, wind_speed, mode, newTimeSlice]);

            // 插入等待队列
            insertWaitingQueue(wind_speed, roomId);
        }

        if (task_type === '调风') {
            // 从等待队列和运行队列中删除该 roomId
            removeFromWaitingQueue(roomId);

            // 查询 schedule_history 中最近的一条记录
            const sqlSelectHistory = `
                SELECT * FROM schedule_history WHERE roomId = ? ORDER BY id DESC LIMIT 1
            `;
            const historyResult = await queryDatabase(sqlSelectHistory, [roomId]);

            if (historyResult.length > 0) {
                const { id: history_id, status, start_time, remainTimeSlice } = historyResult[0];

                if (status === 'running') {
                    const endTime = request_time;
                    const duration = moment.duration(moment(endTime).diff(moment(start_time))).asSeconds();

                    // 更新 schedule_history 的 end_time 和 duration
                    const sqlUpdateHistory = `
                        UPDATE schedule_history SET end_time = ?, duration = ? WHERE id = ?
                    `;
                    await queryDatabase(sqlUpdateHistory, [endTime, duration, history_id]);

                    if (remainTimeSlice > 0) {
                        // const updatedTimeSlice = remainTimeSlice >= 60 ? remainTimeSlice - 60 : 0;
                        // 插入一条新的调度记录
                        const sqlInsertRunning = `
                            INSERT INTO schedule_history (roomId, requestTime, start_time, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice)
                            VALUES (?, ?, ?, 'running', ?, ?, ?, ?, ?)
                        `;
                        await queryDatabase(sqlInsertRunning, [roomId, request_time, request_time, target_temp, romeTemperature, wind_speed, mode, remainTimeSlice]);
                    } else {
                        const sqlInsertRunning = `
                            INSERT INTO schedule_history (roomId, requestTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice)
                            VALUES (?, ?, ?, 'waiting', ?, ?, ?, ?, 120)
                        `;
                        await queryDatabase(sqlInsertRunning, [roomId, request_time, target_temp, romeTemperature, wind_speed, mode, remainTimeSlice]);
                    }
                } else if (status === 'waiting') {
                    // 更新等待记录并重新插入等待队列
                    insertWaitingQueue(wind_speed, roomId);

                    const sqlUpdateWaiting = `
                        UPDATE schedule_history SET duration = 0 WHERE id = ?
                    `;
                    await queryDatabase(sqlUpdateWaiting, [history_id]);

                    const sqlInsertWaiting = `
                        INSERT INTO schedule_history (roomId, requestTime, status, duration, target_temp, current_temp, wind_speed, mode, remainTimeSlice)
                        VALUES (?, ?, 'waiting', 0, ?, ?, ?, ?, ?)
                    `;
                    await queryDatabase(sqlInsertWaiting, [roomId, request_time, target_temp, romeTemperature, wind_speed, mode, newTimeSlice]);
                }
            }
        }
    } catch (err) {
        console.error('Error processing user operation:', err);
    }
}

async function update_database(pool, time) {
    const queryDatabase = (sql, params = []) =>
        new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

    try {
        // 查询runningQueue中的roomId，更新费用
        for (const roomId of runningQueue) {
            const sqlSettings = `SELECT * FROM settings WHERE roomId = ?`;
            const settingsResult = await queryDatabase(sqlSettings, [roomId]);

            if (settingsResult.length === 0) {
                console.error(`No settings found for roomId ${roomId}`);
                continue;
            }

            const { windSpeed, totalCost, cost} = settingsResult[0];
            let costPerMin = 0;

            if (windSpeed === '高') {
                costPerMin = 1;
            } else if (windSpeed === '中') {
                costPerMin = 1 / 2;
            } else {
                costPerMin = 1 / 3;
            }

            const updatedTotalCost = totalCost + costPerMin;

            const sqlUpdateSettings = `UPDATE settings SET cost = ?, totalCost = ? WHERE roomId = ?`;
            await queryDatabase(sqlUpdateSettings, [cost+costPerMin, updatedTotalCost, roomId]);

            const sqlSelectHistory = `SELECT * FROM aircon_history WHERE roomId = ? ORDER BY time DESC LIMIT 1`;
            const historyResult = await queryDatabase(sqlSelectHistory, [roomId]);

            if (historyResult.length > 0) {
                const historyId = historyResult[0].id;

                const sqlUpdateHistory = `UPDATE aircon_history SET cost = ? WHERE id = ?`;
                await queryDatabase(sqlUpdateHistory, [cost+costPerMin, historyId]);
            }
        }

        // const sqlSettings = `SELECT * FROM settings WHERE power = 'on'`;
        // const settingsResult = await queryDatabase(sqlSettings);

        // for (const row of settingsResult) {
        //     const { roomId, windSpeed, totalCost } = row;
        //     let cost = 0;

        //     // 根据风速计算当前用电量
        //     if (windSpeed === '高') {
        //         cost = 1; // 高风速：1度/分钟
        //     } else if (windSpeed === '中') {
        //         cost = 1 / 2; // 中风速：0.5度/分钟
        //     } else {
        //         cost = 1 / 3; // 低风速：0.33度/分钟
        //     }

        //     const updatedTotalCost = totalCost + cost;

        //     // 更新 settings 表中的 cost 和 totalCost
        //     const sqlUpdateSettings = `UPDATE settings SET cost = ?, totalCost = ? WHERE roomId = ?`;
        //     await queryDatabase(sqlUpdateSettings, [cost, updatedTotalCost, roomId]);

        //     // 查询 aircon_history 表中 roomId 最近一条记录
        //     const sqlSelectHistory = `SELECT * FROM aircon_history WHERE roomId = ? ORDER BY time DESC LIMIT 1`;
        //     const historyResult = await queryDatabase(sqlSelectHistory, [roomId]);

        //     if (historyResult.length > 0) {
        //         const historyId = historyResult[0].id;

        //         // 更新 aircon_history 表中最近一条记录的 cost
        //         const sqlUpdateHistory = `UPDATE aircon_history SET cost = ? WHERE id = ?`;
        //         await queryDatabase(sqlUpdateHistory, [cost, historyId]);
        //     }
        // }

        // 调用 simulate_temperature_change 模拟温度变化并更新数据库
        await simulate_temperature_change(pool, time);
    } catch (err) {
        console.error('Error in update_database:', err);
    }
}


// 每轮调度前
async function handle_user_operation(pool, time) {
    const queryDatabase = (sql, params = []) =>
        new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

    try {
        const user_operation = Simulate_user_operation.shift();
        console.log('用户操作', user_operation);

        if (!user_operation) return;

        // 第一部分：处理开关机指令
        try {
            // 找到所有开机指令
            const openIndices = [];
            let idx = user_operation.indexOf('开机');
            while (idx !== -1) {
                openIndices.push(idx + 2001);
                idx = user_operation.indexOf('开机', idx + 1);
            }

            for (const roomId of openIndices) {
                const sqlSelectSettings = `
                    SELECT roomTemperature, setTemperature, initTemperature, mode, windSpeed, sweep 
                    FROM settings 
                    WHERE roomId = ?
                `;
                const settingsResult = await queryDatabase(sqlSelectSettings, [roomId]);

                if (settingsResult.length === 0) {
                    console.log(`No settings found for roomId ${roomId}`);
                    continue;
                }

                const { setTemperature, initTemperature, windSpeed, mode, roomTemperature, sweep } = settingsResult[0];
                const task = {
                    request_time: time,
                    wind_speed: windSpeed,
                    mode,
                    init_temp: initTemperature,
                    target_temp: setTemperature,
                    romeTemperature: roomTemperature,
                    roomId,
                    task: '开机',
                };

                const sqlUpdateSettings = `UPDATE settings SET power = 'on', cost = 0 WHERE roomId = ?`;
                await queryDatabase(sqlUpdateSettings, [roomId]);

                const sqlInsertAirconHistory = `
                    INSERT INTO aircon_history (roomId, time, power, temperature, windSpeed, mode, sweep) 
                    VALUES (?, ?, 'on', ?, ?, ?, ?)
                `;
                await queryDatabase(sqlInsertAirconHistory, [roomId, time, roomTemperature, windSpeed, mode, sweep]);

                console.log('用户操作', task);
                await ProcessUserOperation(task, pool);
            }

            // 找到所有关机指令
            const closeIndices = [];
            idx = user_operation.indexOf('关机');
            while (idx !== -1) {
                closeIndices.push(idx + 2001);
                idx = user_operation.indexOf('关机', idx + 1);
            }

            // 创建一个副本用于遍历，防止原数组在操作中被修改
            for (const roomId of [...closeIndices]) {
                try {
                    const sqlUpdateSettings = `UPDATE settings SET power = 'off', cost = 0 WHERE roomId = ?`;
                    await queryDatabase(sqlUpdateSettings, [roomId]);

                    const sqlSelectSettings = `SELECT * FROM settings WHERE roomId = ?`;
                    let settingsResult = await queryDatabase(sqlSelectSettings, [roomId]);

                    const { roomTemperature, initTemperature, mode, setTemperature, windSpeed, sweep } = settingsResult[0];

                    const sqlInsertAirconHistory = `
                        INSERT INTO aircon_history (roomId, time, power, temperature, windSpeed, mode, sweep)
                        VALUES (?, ?, 'off', ?, ?, ?, ?)
                    `;
                    const airconHistory = await queryDatabase(sqlInsertAirconHistory, [roomId, time, roomTemperature, windSpeed, mode, sweep]);
                    

                    const sqlInsertHistory = `
                        INSERT INTO schedule_history (roomId, requestTime, status, duration) 
                        VALUES (?, ?, NULL, 0)
                    `;
                    await queryDatabase(sqlInsertHistory, [roomId, time]);

                    // 移出队列，确保安全操作
                    removeFromWaitingQueue(roomId);

                    const runningIndex = runningQueue.indexOf(roomId);
                    if (runningIndex > -1) {
                        runningQueue.splice(runningIndex, 1);
                    }

                    const offIndex = offQueue.indexOf(roomId);
                    if (offIndex > -1) {
                        offQueue.splice(offIndex, 1);
                    }
                } catch (err) {
                    console.error(`Error processing roomId ${roomId}:`, err);
                }
            }

        } catch (err) {
            console.error('Error handling open/close operations:', err);
        }

        // 第二部分：处理调风调温指令
        try {
            const indices_temp = {};
            const indices_wind = {};

            for (let i = 0; i < user_operation.length; i++) {
                const operation = user_operation[i];
                if (operation && operation !== '开机' && operation !== '关机') {
                    if (operation.includes(',')) {
                        const [first, second] = operation.split(',');
                        if (['高', '中', '低'].includes(first)) {
                            indices_wind[i] = first;
                            indices_temp[i] = parseInt(second);
                        } else {
                            indices_temp[i] = parseInt(first);
                            indices_wind[i] = second;
                        }
                    } else if (['高', '中', '低'].includes(operation)) {
                        indices_wind[i] = operation;
                    } else {
                        indices_temp[i] = parseInt(operation);
                    }
                }
            }
            // 处理调风
            for (const [key, windSpeed] of Object.entries(indices_wind)) {
                const roomId = parseInt(key) + 2001;

                const sqlSelectSettings = `
                    SELECT roomTemperature, initTemperature, mode, setTemperature, sweep, power 
                    FROM settings 
                    WHERE roomId = ?
                `;
                const settingsResult = await queryDatabase(sqlSelectSettings, [roomId]);

                if (settingsResult.length === 0) {
                    console.error(`No settings found for roomId ${roomId}`);
                    continue;
                }

                const { roomTemperature, initTemperature, mode, setTemperature, sweep, power } = settingsResult[0];

                const task = {
                    request_time: time,
                    wind_speed: windSpeed,
                    mode: mode,
                    init_temp: initTemperature,
                    target_temp: setTemperature,
                    romeTemperature: roomTemperature,
                    roomId: roomId,
                    task: '调风',
                };

                const sqlUpdateWindSpeed = `UPDATE settings SET windSpeed = ?, cost = 0 WHERE roomId = ?`;
                await queryDatabase(sqlUpdateWindSpeed, [windSpeed, roomId]);

                const sqlInsertAirconHistory = `INSERT INTO aircon_history (roomId, time, power, temperature, windSpeed, mode, sweep) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                await queryDatabase(sqlInsertAirconHistory, [roomId, time, power, setTemperature, windSpeed, mode, sweep]);

                console.log('用户操作', task);
                await ProcessUserOperation(task, pool);
            }

            // 处理调温
            for (const [key, setTemperature] of Object.entries(indices_temp)) {
                const roomId = parseInt(key) + 2001;

                const sqlUpdateTemperature = `UPDATE settings SET setTemperature = ? WHERE roomId = ?`;
                await queryDatabase(sqlUpdateTemperature, [setTemperature, roomId]);

                const sqlUpdateHistory = `
                    UPDATE schedule_history 
                    SET target_temp = ? 
                    WHERE roomId = ? 
                    ORDER BY id DESC LIMIT 1
                `;
                await queryDatabase(sqlUpdateHistory, [setTemperature, roomId]);
            }
            // 调温不影响调度，不计入了
            // const sqlSelectAllSettings = `SELECT * FROM settings WHERE roomId BETWEEN 2001 AND 2005`;
            // const allSettings = await queryDatabase(sqlSelectAllSettings);

            // for (const row of allSettings) {
            //     const { roomId, power, roomTemperature, windSpeed, mode } = row;
            //     const sqlInsertHistory = `
            //         INSERT INTO aircon_history (roomId, time, power, temperature, windSpeed, mode) 
            //         VALUES (?, ?, ?, ?, ?, ?)
            //     `;
            //     await queryDatabase(sqlInsertHistory, [
            //         roomId,
            //         time,
            //         power,
            //         roomTemperature,
            //         windSpeed,
            //         mode,
            //     ]);
            // }
        } catch (err) {
            console.error('Error handling wind/temperature operations:', err);
        }
    } catch (err) {
        console.error('Error in handle_user_operation:', err);
    }
}


async function simulate_temperature_change(pool, time) {
    const queryDatabase = (sql, params = []) =>
        new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

    if (runningQueue.length > 0) {
        for (const roomId of runningQueue) {
            try {
                // 查询 settings 表获取房间信息
                let sql = `SELECT * FROM settings WHERE roomId = ?`;
                const settingsResult = await queryDatabase(sql, [roomId]);
                const { roomTemperature, initTemperature, mode, setTemperature, windSpeed } = settingsResult[0];

                let newTemp = mode === 'cold' ? roomTemperature - 0.5 : roomTemperature + 0.5;

                // 更新 schedule_history 的 end_time 和 duration
                sql = `SELECT * FROM schedule_history WHERE roomId = ? ORDER BY id DESC LIMIT 1`;
                const historyResult = await queryDatabase(sql, [roomId]);
                const { id: historyId, start_time: startTime, requestTime: requestTime } = historyResult[0];
                if (!startTime) {
                    startTime = requestTime;
                }
                const duration = moment.duration(moment(time).diff(moment(startTime))).asSeconds();

                sql = `UPDATE schedule_history SET end_time = ?, duration = ? WHERE id = ?`;
                await queryDatabase(sql, [time, duration, historyId]);

                // 更新 settings 中 roomTemperature
                sql = `UPDATE settings SET roomTemperature = ? WHERE roomId = ?`;
                await queryDatabase(sql, [newTemp, roomId]);

                if (newTemp === setTemperature) {
                    // 插入新的 schedule_history 记录
                    sql = `INSERT INTO schedule_history (roomId, requestTime, status, duration, target_temp, current_temp, wind_speed, mode) VALUES (?, ?, 'off', 0, ?, ?, ?, ?)`;
                    await queryDatabase(sql, [roomId, time, setTemperature, newTemp, windSpeed, mode]);

                    // 更新队列
                    runningQueue.splice(runningQueue.indexOf(roomId), 1);
                    offQueue.push(roomId);
                }
            } catch (err) {
                console.error(`Error processing roomId ${roomId} in runningQueue:`, err);
            }
        }
    }

    if (offQueue.length > 0) {
        for (const roomId of offQueue) {
            try {
                // 查询 settings 表获取房间信息
                let sql = `SELECT * FROM settings WHERE roomId = ?`;
                const settingsResult = await queryDatabase(sql, [roomId]);
                const { roomTemperature, initTemperature, setTemperature, windSpeed, mode } = settingsResult[0];

                let newTemp = roomTemperature < initTemperature
                    ? roomTemperature + 0.5
                    : roomTemperature > initTemperature
                        ? roomTemperature - 0.5
                        : roomTemperature;

                // 更新 settings 中 roomTemperature
                sql = `UPDATE settings SET roomTemperature = ? WHERE roomId = ?`;
                await queryDatabase(sql, [newTemp, roomId]);

                if (newTemp === initTemperature) {
                    // 插入新的 schedule_history 记录
                    sql = `INSERT INTO schedule_history (roomId, requestTime, status, duration, target_temp, current_temp, wind_speed, mode) VALUES (?, ?, 'waiting', 0, ?, ?, ?, ?)`;
                    await queryDatabase(sql, [roomId, time, setTemperature, newTemp, windSpeed, mode]);

                    // 更新队列
                    offQueue.splice(offQueue.indexOf(roomId), 1);
                    insertWaitingQueue(windSpeed, roomId);
                }
            } catch (err) {
                console.error(`Error processing roomId ${roomId} in offQueue:`, err);
            }
        }
    }
}


async function handle_runningQueue_TimeSlice(pool, time) {
    const queryDatabase = (sql, params = []) =>
        new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

    if (runningQueue.length > 0) {
        // 创建副本，防止在遍历过程中修改原数组导致问题
        const runningQueueCopy = [...runningQueue];

        for (const roomId of runningQueueCopy) {
            try {
                // 先更新 remainTimeSlice，存入数据库
                let sql = `UPDATE schedule_history 
                           SET remainTimeSlice = remainTimeSlice - 60, end_time = ? 
                           WHERE roomId = ? ORDER BY id DESC LIMIT 1`;
                await queryDatabase(sql, [time, roomId]);

                // 查询数据库 schedule_history 中该 roomId 的最近一条数据
                sql = `SELECT * FROM schedule_history WHERE roomId = ? ORDER BY id DESC LIMIT 1`;
                const results = await queryDatabase(sql, [roomId]);

                if (results.length === 0) {
                    console.log(`No schedule history found for roomId: ${roomId}`);
                    continue;
                }

                const row = results[0];
                const history_id = row.id;
                const remainTimeSlice = row.remainTimeSlice;
                const endTime = time;
                const startTime = row.start_time;
                const duration = moment.duration(moment(endTime).diff(moment(startTime))).asSeconds();

                console.log('现在的时间', time);
                console.log('现在检查时间片是否用完的房间', roomId);
                console.log('现在检查时间片是否用完的房间的剩余时间片', remainTimeSlice);

                if (remainTimeSlice === 0) {
                    // 移出 runningQueue，放入 waitingQueue
                    const index = runningQueue.indexOf(roomId);
                    if (index > -1) {
                        runningQueue.splice(index, 1);
                        insertWaitingQueue(row.wind_speed, roomId);
                    }

                    // 更新该行 end_time 和 duration
                    sql = `UPDATE schedule_history 
                           SET end_time = ?, duration = ? 
                           WHERE id = ?`;
                    await queryDatabase(sql, [endTime, duration, history_id]);

                    // 获取 requestTime 并插入一条新数据
                    const requestTime = time;
                    sql = `INSERT INTO schedule_history (roomId, requestTime, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice) 
                           VALUES (?, ?, 'waiting', ?, ?, ?, ?, ?)`;
                    await queryDatabase(sql, [
                        roomId,
                        requestTime,
                        row.target_temp,
                        row.current_temp,
                        row.wind_speed,
                        row.mode,
                        120,
                    ]);
                }
            } catch (err) {
                console.error(`Error processing roomId ${roomId}:`, err);
            }
        }
    }
}



async function schedule(pool, time) {
    try {
        // 查询 central_settings 获取 resourceLimit
        const sqlResourceLimit = `SELECT resourceLimit FROM central_settings`;
        const centralSettings = await queryDatabase(pool, sqlResourceLimit);

        if (centralSettings.length === 0) {
            console.error('No central settings found.');
            return;
        }

        const resourceLimit = centralSettings[0].resourceLimit;
        const runningQueueLength = runningQueue.length;

        // 计算可用资源数，从 waitingQueue 按优先级取出资源，放入 runningQueue
        for (let i = 0; i < resourceLimit - runningQueueLength; i++) {
            let roomId = null;

            if (waitingQueue['高'].length > 0) {
                roomId = waitingQueue['高'].shift();
            } else if (waitingQueue['中'].length > 0) {
                roomId = waitingQueue['中'].shift();
            } else if (waitingQueue['低'].length > 0) {
                roomId = waitingQueue['低'].shift();
            } else {
                // 没有更多资源需要调度
                break;
            }

            if (roomId) {
                runningQueue.push(roomId);

                // 查询 settings 表中 roomId 的信息
                const sqlSettings = `SELECT * FROM settings WHERE roomId = ?`;
                const settingsResult = await queryDatabase(pool, sqlSettings, [roomId]);

                if (settingsResult.length === 0) {
                    console.error(`No settings found for roomId: ${roomId}`);
                    continue;
                }

                const { roomTemperature, mode, setTemperature, windSpeed } = settingsResult[0];

                // 查询 schedule_history 中 roomId 的最近一条记录
                const sqlScheduleHistory = `SELECT * FROM schedule_history WHERE roomId = ? ORDER BY id DESC LIMIT 1`;
                const historyResult = await queryDatabase(pool, sqlScheduleHistory, [roomId]);

                if (historyResult.length === 0) {
                    console.error(`No schedule history found for roomId: ${roomId}`);
                    continue;
                }

                const { requestTime, remainTimeSlice } = historyResult[0];
                const formattedRequestTime = moment(requestTime).format('YYYY-MM-DD HH:mm:ss');

                // 插入一条新的 schedule_history 记录
                const sqlInsertHistory = `
                    INSERT INTO schedule_history (roomId, requestTime, start_time, status, target_temp, current_temp, wind_speed, mode, remainTimeSlice)
                    VALUES (?, ?, ?, 'running', ?, ?, ?, ?, ?)
                `;
                await queryDatabase(pool, sqlInsertHistory, [
                    roomId,
                    formattedRequestTime,
                    time,
                    setTemperature,
                    roomTemperature,
                    windSpeed,
                    mode,
                    remainTimeSlice,
                ]);

                console.log(`Inserted schedule_history for roomId: ${roomId}`);
            }
        }
    } catch (err) {
        console.error('Error in scheduling:', err);
    }
}


function queryDatabase(pool, sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) {
                return reject(err); // 查询出错，Promise 进入 rejected 状态
            }
            resolve(results); // 查询成功，Promise 进入 resolved 状态
        });
    });
}


// 需补充数据库cost条目 区分不同风速的用电量（高风速1度1分钟，中风速1度2分钟，低风速1度3分钟）

async function startScheduler(pool) {
    console.log("Scheduler started...");
    let time = '2024-11-25 00:00:00';

    setInterval(async () => {
        try {
            // 更新当前时间
            time = moment(time).add(1, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            console.log('step1: 获取当前时间', time);

            // 处理每次调度前的用户操作
            await handle_user_operation(pool, time);
            console.log('step2: 处理用户操作完成');

            // 处理 runningQueue 对象的去留问题
            await handle_runningQueue_TimeSlice(pool, time);
            console.log('step3: 处理 runningQueue 完成');

            // 执行调度逻辑
            await schedule(pool, time);
            console.log('runningQueue:', runningQueue);
            console.log('waitingQueue:', waitingQueue);
            console.log('offQueue:', offQueue);
            console.log('step4: 调度结束');

            // 更新数据库
            await update_database(pool, time);
            console.log('step5: 更新数据库完成');
        } catch (err) {
            console.error('Error in scheduler:', err);
        }
    }, 5000); // 每 10 秒执行一次
}


// 导出函数供主程序调用
module.exports = {
  start: startScheduler,
};


