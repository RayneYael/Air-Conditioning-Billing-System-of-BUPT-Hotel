import moment from 'moment';

// 定义房间类型常量和价格
export const ROOM_TYPES = {
  STANDARD: {
    name: '标准间',
    price: 200 // 每晚价格
  },
  LARGE: {
    name: '大床房',
    price: 500 // 每晚价格
  }
};

/**
 * 计算住宿费用
 * @param {string} checkInTime - 入住时间
 * @param {string} roomType - 房间类型
 * @returns {number} - 住宿费用
 */
export const calculateRoomFee = (checkInTime, roomType) => {
  if (!checkInTime) return 0;

  const checkIn = moment(checkInTime).local();
  const now = moment().local();
  const checkInDay = checkIn.startOf('day');
  const nowDay = now.startOf('day');

  // 计算已经过去的天数
  const daysPassed = Math.max(1, nowDay.diff(checkInDay, 'days') + 1);

  // 如果当前时间超过12点，且还未退房，加收一天
  const addExtraDay = now.hour() >= 12;
  const totalDays = addExtraDay ? daysPassed + 1 : daysPassed;

  const basePrice = roomType === ROOM_TYPES.STANDARD.name ? ROOM_TYPES.STANDARD.price : ROOM_TYPES.LARGE.price;

  return totalDays * basePrice;
};

/**
 * 获取房间类型
 * @param {number} roomId - 房间号
 * @returns {string} - 房间类型名称
 */
export const getRoomType = (roomId) => {
  return roomId < 5000 ? ROOM_TYPES.LARGE.name : ROOM_TYPES.STANDARD.name;
};

/**
 * 格式化金额显示
 * @param {number} amount - 金额
 * @returns {string} - 格式化后的金额字符串
 */
export const formatAmount = (amount) => {
  return Number(amount).toFixed(2);
};