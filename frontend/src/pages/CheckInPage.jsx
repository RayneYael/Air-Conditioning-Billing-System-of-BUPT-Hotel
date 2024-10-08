import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Input } from 'antd';
import { CheckOutlined, PrinterOutlined, LogoutOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';  // 引入axios进行数据请求
import moment from 'moment';  // 引入moment处理时间

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const CheckInPage = () => {
  const [roomData, setRoomData] = useState([]);
  const [inputName, setInputName] = useState(''); // 输入框的顾客姓名
  const [selectedRoom, setSelectedRoom] = useState(null); // 选择入住的房间
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制Modal的可见性
  const [feeData, setFeeData] = useState([]); // 存储费用详情
  const [totalCost, setTotalCost] = useState(0); // 存储总费用
  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false); // 入住模态框的可见性
  const [isFeeModalVisible, setIsFeeModalVisible] = useState(false); // 费用模态框的可见性
  

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`http://${Host}:${Port}/api/rooms`);
        if (Array.isArray(response.data)) {
          const rooms = response.data;

          // 获取每个房间的总费用并更新数据
          const updatedRooms = await Promise.all(
            rooms.map(async (room) => {
              if (room.checkedIn) {
                // 调用后端接口获取每个房间的费用
                const feeResponse = await axios.get(`http://${Host}:${Port}/api/calculateFee/${room.roomId}`);
                return { ...room, airConditionerFee: feeResponse.data.totalFee };
              }
              return { ...room, airConditionerFee: 0 }; // 未入住的房间，费用为 0
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
    setSelectedRoom(record); // 设置当前选择的房间
    setInputName(''); // 清空输入框
    setIsCheckInModalVisible(true); // 显示入住的 Modal
  };

  // 处理Modal确认
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
        setIsCheckInModalVisible(false); // 关闭入住的 Modal
      })
      .catch((error) => {
        message.error('办理入住时发生错误');
        console.error('入住失败:', error);
      });
  };

  // 处理Modal取消
  const handleCheckInCancel = () => {
    setIsCheckInModalVisible(false); // 关闭 CheckIn Modal
  };

  // 处理费用详情模态框关闭
  const handleFeeModalCancel = () => {
    setIsFeeModalVisible(false); // 关闭费用模态框
  };

  // 办理退房
  const handleCheckOut = (record) => {
    Modal.confirm({
      title: '确认办理退房？',
      content: `房间号: ${record.roomId}, 顾客: ${record.customerName}`,
      onOk: () => {
        // 退房并打印费用详情
        showFeeDetailsModal(record);
        axios.post(`http://${Host}:${Port}/api/checkout/`+record.roomId)
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
    });
  };

  // 调用后端接口获取费用详情
  const showFeeDetailsModal = (record) => {
    axios.get(`http://${Host}:${Port}/api/calculateFee/${record.roomId}`)
      .then(response => {
        const { totalFee, calculatedData } = response.data;
        setSelectedRoom(record);
        setTotalCost(totalFee);
        setFeeData(calculatedData);
        setIsFeeModalVisible(true); // 显示费用详单的 Modal
      })
      .catch(error => {
        setSelectedRoom(record.roomId);
        message.error('获取费用详情失败');
      });
  };

  // 定义费用详情的列
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

  // 定义表格列
  const columns = [
    {
      title: '房间号',
      dataIndex: 'roomId',
      key: 'roomId',
      // 数值排序，直接使用 a.roomId - b.roomId
      sorter: (a, b) => a.roomId - b.roomId,
      render: (roomId) => <Tag color="blue">{roomId}</Tag>,
    },
    {
      title: '顾客姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      // 顾客姓名搜索框
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索顾客姓名"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}  // 回车确认搜索
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}  // 确认按钮
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => clearFilters()}  // 清除搜索
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) =>
        record.customerName ? record.customerName.toLowerCase().includes(value.toLowerCase()) : '',
      
      render: (customerName) => {
        if (!customerName) return '';
        if (customerName.length <= 1) return customerName;
        return `${customerName[0]}${'*'.repeat(customerName.length - 1)}`;
      },
    },
    {
      title: '入住时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (checkInTime) => checkInTime ? new Date(checkInTime).toLocaleString('zh-CN', { hour12: false }) : '',
    },
    {
      title: '空调费用 (元)',
      dataIndex: 'airConditionerFee',
      key: 'airConditionerFee',
      render: (fee) => `${fee} ¥`, // 直接从 roomData 渲染费用
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) => (
        <Space size="middle">
          {!record.checkedIn ? (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => showCheckInModal(record)}>
              入住
            </Button>
          ) : (
            <>
              <Button type="default" icon={<PrinterOutlined />} onClick={() => showFeeDetailsModal(record)}>
                打印详单
              </Button>
              <Button type="danger" icon={<LogoutOutlined />} onClick={() => handleCheckOut(record)}>
                退房
              </Button>
            </>
          )}
        </Space>
      ),
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Table
        columns={columns}
        dataSource={Array.isArray(roomData) ? roomData : []}  // 确保传递的是一个数组
        pagination={{ pageSize: 10 }}
      />

      {/* Modal for Check-in */}
      <Modal
        title={`办理入住 - 房间号: ${selectedRoom?.roomId}`}
        open={isCheckInModalVisible}
        onOk={handleCheckInOk}
        onCancel={handleCheckInCancel}
      >
        <Input
          placeholder="请输入顾客姓名"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
        />
      </Modal>

      {/* 费用详情的 Modal */}
      <Modal
        title={`费用详情 - 房间号: ${selectedRoom?.roomId}`}
        open={isFeeModalVisible}
        onCancel={handleFeeModalCancel}
        footer={[
          <Button key="close" onClick={handleFeeModalCancel}>
            关闭
          </Button>,
        ]}
      >
        <Table columns={feeColumns} dataSource={feeData} pagination={false} />
        <div style={{ marginTop: '16px', fontWeight: 'bold', fontSize: '16px' }}>
          当前总费用: {totalCost} 元
        </div>
      </Modal>
    </div>
  );
};

export default CheckInPage;
