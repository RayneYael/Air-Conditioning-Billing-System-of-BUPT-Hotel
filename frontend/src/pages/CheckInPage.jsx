import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Input, Card } from 'antd';
import { CheckOutlined, PrinterOutlined, LogoutOutlined, SearchOutlined, HomeOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { ROOM_TYPES, calculateRoomFee, getRoomType, formatAmount } from '../utils/roomUtils';

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const CheckInPage = () => {
  const [roomData, setRoomData] = useState([]);
  const [inputName, setInputName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [feeData, setFeeData] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [roomFee, setRoomFee] = useState(0);
  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  const [isFeeModalVisible, setIsFeeModalVisible] = useState(false);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`http://${Host}:${Port}/api/rooms`);
        if (Array.isArray(response.data)) {
          const rooms = response.data;

          const updatedRooms = await Promise.all(
            rooms.map(async (room) => {
              if (room.checkedIn) {
                const feeResponse = await axios.get(`http://${Host}:${Port}/api/calculateFee/${room.roomId}`);
                const roomType = getRoomType(room.roomId);
                const calculatedRoomFee = calculateRoomFee(room.checkInTime, roomType);

                return {
                  ...room,
                  airConditionerFee: Number(feeResponse.data.totalFee) || 0,
                  roomType,
                  roomFee: calculatedRoomFee
                };
              }
              return {
                ...room,
                airConditionerFee: 0,
                roomType: getRoomType(room.roomId),
                roomFee: 0
              };
            })
          );

          setRoomData(updatedRooms);
        } else {
          console.error('Expected an array but got:', response.data);
          setRoomData([]);
        }
      } catch (error) {
        message.error('获取房间数据失败');
        console.error(error);
        setRoomData([]);
      }
    };

    fetchRoomData();
  }, []);

  const showCheckInModal = (record) => {
    setSelectedRoom(record);
    setInputName('');
    setIsCheckInModalVisible(true);
  };

  const handleCheckInOk = () => {
    if (!inputName) {
      message.error('顾客姓名不能为空');
      return;
    }

    const checkInTime = new Date().toLocaleString('zh-CN', { hour12: false });

    axios.post(`http://${Host}:${Port}/api/checkin/${selectedRoom.roomId}`, {
      customerName: inputName,
      checkInTime: checkInTime
    })
      .then(() => {
        const newRoomData = roomData.map(room => {
          if (room.roomId === selectedRoom.roomId) {
            return {
              ...room,
              customerName: inputName,
              checkInTime: checkInTime,
              checkedIn: true,
            };
          }
          return room;
        });
        setRoomData(newRoomData);
        message.success(`房间 ${selectedRoom.roomId} 入住成功！`);
        setIsCheckInModalVisible(false);
      })
      .catch((error) => {
        message.error('办理入住时发生错误');
        console.error('入住失败:', error);
      });
  };

  const handleCheckInCancel = () => {
    setIsCheckInModalVisible(false);
  };

  const handleFeeModalCancel = () => {
    setIsFeeModalVisible(false);
  };

  const handleCheckOut = (record) => {
    Modal.confirm({
      title: '确认办理退房？',
      content: `房间号: ${record.roomId}, 顾客: ${record.customerName}`,
      onOk: () => {
        showFeeDetailsModal(record);
        axios.post(`http://${Host}:${Port}/api/checkout/` + record.roomId)
          .then(() => {
            const newRoomData = roomData.map(room => {
              if (room.roomId === record.roomId) {
                return { ...room, customerName: '', checkInTime: '', checkedIn: false };
              }
              return room;
            });
            setRoomData(newRoomData);
            message.success(`房间 ${record.roomId} 退房成功！`);
          })
          .catch(error => {
            message.error('退房失败');
            console.error(error);
          });
      },
      // 添加样式定位
      style: { top: '30%' },
    });
  };

  const showFeeDetailsModal = (record) => {
    axios.get(`http://${Host}:${Port}/api/calculateFee/${record.roomId}`)
      .then(response => {
        const { totalFee, calculatedData: feeDetails } = response.data;
        const calculatedRoomFee = calculateRoomFee(record.checkInTime, record.roomType);

        // 使用工具函数确保数值类型
        const parsedTotalFee = Number(totalFee) || 0;
        const parsedRoomFee = Number(calculatedRoomFee) || 0;

        setSelectedRoom(record);
        setTotalCost(parsedTotalFee);
        setRoomFee(parsedRoomFee);
        setFeeData(feeDetails);
        setIsFeeModalVisible(true);
      })
      .catch(error => {
        setSelectedRoom(record.roomId);
        message.error('获取费用详情失败');
      });
  };

  


  const feeColumns = [
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime) => moment(startTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '修改设置',
      dataIndex: 'changedSetting',
      key: 'changedSetting',
    },
    {
      title: '每小时费用 (元)',
      dataIndex: 'costPerHour',
      key: 'costPerHour',
    },
    {
      title: '阶段费用 (元)',
      dataIndex: 'stageCost',
      key: 'stageCost',
    },
  ];

  const columns = [
    {
      title: '房间号',
      dataIndex: 'roomId',
      key: 'roomId',
      width: '10%',
      align: 'center',  // 设置列的对齐方式为居中
      sorter: (a, b) => a.roomId - b.roomId,
      render: (roomId) => (
        <span className="text-base font-bold">
          {roomId}
        </span>
      ),
    },
    {
      title: '房间类型',
      dataIndex: 'roomType',
      key: 'roomType',
      width: '12%',
      filters: [
        { text: '标准间', value: ROOM_TYPES.STANDARD },
        { text: '大床房', value: ROOM_TYPES.LARGE },
      ],
      onFilter: (value, record) => record.roomType === value,
      render: (type) => {
        const colorMap = {
          '标准间': 'blue',
          '大床房': 'purple'
        };
        return (
          <Tag color={colorMap[type]} className="px-3 py-1">
            <HomeOutlined className="mr-1" />
            {type}
          </Tag>
        );
      },
    },
    {
      title: '顾客姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '12%',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div className="p-4">
          <Input
            placeholder="搜索顾客姓名"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            className="mb-3"
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              className="w-24"
            >
              搜索
            </Button>
            <Button
              onClick={() => clearFilters()}
              className="w-24"
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) =>
        record.customerName ? record.customerName.toLowerCase().includes(value.toLowerCase()) : '',
      render: (customerName) => {
        if (!customerName) return '-';
        return (
          <span className="text-base">
            <UserOutlined className="mr-2" />
            {`${customerName[0]}${'*'.repeat(customerName.length - 1)}`}
          </span>
        );
      },
    },
    {
      title: '入住时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: '18%',
      render: (checkInTime) => checkInTime ?
        <span className="text-gray-600 text-base">
          {moment(checkInTime).format('YYYY-MM-DD HH:mm:ss')}
        </span> : '-',
    },
    {
      title: '空调费用',
      dataIndex: 'airConditionerFee',
      key: 'airConditionerFee',
      width: '12%',
      render: (fee) => (
        <Tag color="green" className="px-3 py-1.5 text-base">
          {fee} ¥
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'operation',
      width: '20%',
      render: (_, record) => (
        <Space size="middle" className="flex flex-wrap gap-2">
          {!record.checkedIn ? (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => showCheckInModal(record)}
              className="min-w-[100px] rounded"
            >
              入住
            </Button>
          ) : (
            <>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={() => showFeeDetailsModal(record)}
                className="min-w-[100px] rounded"
              >
                打印详单
              </Button>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={() => handleCheckOut(record)}
                className="min-w-[100px] rounded"
              >
                退房
              </Button>
            </>
          )}
        </Space>
      ),
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-sm">
          <Table
            columns={columns}
            dataSource={Array.isArray(roomData) ? roomData : []}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 个房间`,
              className: "my-4",
              showQuickJumper: true
            }}
            className="bg-white rounded"
            rowClassName={(record) => record.checkedIn ? 'bg-blue-50' : ''}
          />
        </Card>

        {/* 入住模态框 */}
        <Modal
          title={
            <div className="flex items-center space-x-2">
              <CheckOutlined className="text-green-500" />
              <span className="text-lg font-medium">办理入住 - 房间号: {selectedRoom?.roomId}</span>
            </div>
          }
          open={isCheckInModalVisible}
          onOk={handleCheckInOk}
          onCancel={handleCheckInCancel}
          okText="确认入住"
          cancelText="取消"
          style={{ top: '30%' }}
        >
          <div className="mt-4">
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入顾客姓名"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="rounded py-2"
            />
          </div>
        </Modal>

        {/* 费用详情弹窗 */}
        <Modal
          title={
            <div className="flex items-center space-x-2 text-gray-800">
              <PrinterOutlined className="text-xl" />
              <span className="text-xl font-medium">费用详情</span>
              <Tag color="blue" className="ml-2">房间 {selectedRoom?.roomId}</Tag>
            </div>
          }
          open={isFeeModalVisible}
          onCancel={handleFeeModalCancel}
          footer={[
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              className="mr-2"
            >
              打印详单
            </Button>,
            <Button
              key="close"
              onClick={handleFeeModalCancel}
              className="hover:bg-gray-100"
            >
              关闭
            </Button>
          ]}
          width={800}
          className="rounded-lg"
          style={{ top: '1%' }}
        >
          <div className="space-y-4">
            {/* 费用摘要卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">房间类型</div>
                  <div className="text-lg font-medium text-gray-800">
                    {selectedRoom?.roomType}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">入住时间</div>
                  <div className="text-lg font-medium text-gray-800">
                    {selectedRoom?.checkInTime ? moment(selectedRoom.checkInTime).format('MM-DD HH:mm') : '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">顾客姓名</div>
                  <div className="text-lg font-medium text-gray-800">
                    {selectedRoom?.customerName || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-base text-gray-500">订单状态</div>
                  <Tag color="green" className="text-base">
                    已入住
                  </Tag>
                </div>
              </div>
            </div>

            {/* 费用明细卡片 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-medium text-gray-800 mb-3">费用明细</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <HomeOutlined className="text-purple-500 mr-2" />
                    <span className="text-gray-600 text-sm">住宿费用</span>
                  </div>
                  <div className="text-xl font-medium text-purple-600 text-center">
                    ¥ {formatAmount(roomFee)}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <DollarOutlined className="text-blue-500 mr-2" />
                    <span className="text-gray-600 text-sm">空调费用</span>
                  </div>
                  <div className="text-xl font-medium text-blue-600 text-center">
                    ¥ {formatAmount(totalCost)}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <DollarOutlined className="text-green-500 mr-2" />
                    <span className="text-gray-600 text-sm">总计费用</span>
                  </div>
                  <div className="text-xl font-medium text-green-600 text-center">
                    ¥ {formatAmount(Number(roomFee) + Number(totalCost))}
                  </div>
                </div>
              </div>
            </div>

            {/* 空调使用明细表格 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">空调使用明细</h3>
              <Table
                columns={[
                  {
                    title: '开始时间',
                    dataIndex: 'startTime',
                    key: 'startTime',
                    width: '25%',
                    render: (startTime) => (
                      <div className="text-gray-600">
                        {moment(startTime).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    ),
                  },
                  {
                    title: '修改设置',
                    dataIndex: 'changedSetting',
                    width: '25%',
                    key: 'changedSetting',
                  },
                  {
                    title: '每小时费用',
                    dataIndex: 'costPerHour',
                    key: 'costPerHour',
                    width: '15%',
                    render: (cost) => (
                      <div className="text-gray-600">
                        ¥ {formatAmount(cost)}/小时
                      </div>
                    ),
                  },
                  {
                    title: '阶段费用',
                    dataIndex: 'stageCost',
                    key: 'stageCost',
                    width: '15%',
                    render: (cost) => (
                      <div className="font-medium text-blue-600">
                        ¥ {formatAmount(cost)}
                      </div>
                    ),
                  },
                ]}
                dataSource={feeData}
                pagination={false}
                className="border rounded"
                rowClassName="hover:bg-gray-50"
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CheckInPage;