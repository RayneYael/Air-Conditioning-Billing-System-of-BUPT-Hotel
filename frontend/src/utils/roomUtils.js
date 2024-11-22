import moment from 'moment';

// 定义房间类型常量和价格
export const ROOM_TYPES = {
  STANDARD: {
    name: '标准间',
    price: 200  // 每晚价格
  },
  LARGE: {
    name: '大床房',
    price: 500  // 每晚价格
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
  
  const checkIn = moment(checkInTime);
  const now = moment();
  
  // 计算入住天数（向上取整，不足一天按一天计算）
  const days = Math.ceil(now.diff(checkIn, 'hours') / 24);
  
  // 获取房间基础价格
  const basePrice = roomType === ROOM_TYPES.STANDARD.name 
    ? ROOM_TYPES.STANDARD.price 
    : ROOM_TYPES.LARGE.price;
  
  return days * basePrice;
};

/**
 * 获取房间类型
 * @param {number} roomId - 房间号
 * @returns {string} - 房间类型名称
 */
export const getRoomType = (roomId) => {
  return roomId % 2 === 0 ? ROOM_TYPES.LARGE.name : ROOM_TYPES.STANDARD.name;
};

/**
 * 格式化金额显示
 * @param {number} amount - 金额
 * @returns {string} - 格式化后的金额字符串
 */
export const formatAmount = (amount) => {
  return Number(amount).toFixed(2);
};