import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Input, Card } from 'antd';
import { CheckOutlined, PrinterOutlined, LogoutOutlined, SearchOutlined, HomeOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { ROOM_TYPES, calculateRoomFee, formatAmount, getRoomType } from '../utils/roomUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Host = import.meta.env.VITE_DEV_SERVER_HOST;
const Port = import.meta.env.VITE_API_PORT;

const CheckInPage = () => {
  const [roomData, setRoomData] = useState([]);
  const [inputName, setInputName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [feeData, setFeeData] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [roomFee, setRoomFee] = useState(0);
  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  const [isFeeModalVisible, setIsFeeModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);


  // 获取房间数据
  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('token:', token);

      const response = await axios.post(`http://${Host}:${Port}/stage/query`, {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

      if (response.data.code === 0) {
        // 处理返回的数据
        const processedData = response.data.data.map(room => {
          const roomFee = room.checkInTime
            ? calculateRoomFee(room.checkInTime, room.roomLevel)
            : 0;
          // console.log('Input:', {
          //   checkInTime: room.checkInTime,
          //   roomLevel: room.roomLevel,
          //   result: roomFee
          // });

          return {
            ...room,
            key: room.roomId,
            checkedIn: room.people && room.people.length > 0,
            roomFee: roomFee,
            totalFee: roomFee + (room.cost || 0) // 房费 + 空调费
          };
        });
        setRoomData(processedData);


      } else {
        message.error(response.data.message || '获取房间数据失败');
        setRoomData([]);
      }
    } catch (error) {
      message.error('获取房间数据失败');
      console.error(error);
      setRoomData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();

    const updateFees = () => {
      setRoomData(prevData => prevData.map(room => {
        if (!room.checkInTime) return room;
        
        const currentFee = calculateRoomFee(room.checkInTime, room.roomLevel)
        return {
          ...room,
          roomFee: currentFee,
          totalFee: currentFee + (room.cost || 0)
        };
      }));
    };

    const intervals = [
      setInterval(fetchRoomData, 1000),
      setInterval(updateFees, 1000)
    ];

    return () => intervals.forEach(clearInterval)
  }, []);


  const showCheckInModal = (record) => {
    setSelectedRoom(record);
    setInputName('');
    setIsCheckInModalVisible(true);
  };

  // 入住处理函数
  const handleCheckInOk = async () => {
    if (!inputName) {
      message.error('顾客姓名不能为空');
      return;
    }
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(`http://${Host}:${Port}/stage/add`, {
        roomId: selectedRoom.roomId,
        peopleName: inputName  // 注意这里使用 inputName 而不是 peopleName
      },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        message.success(response.data.message || '入住成功');
        setIsCheckInModalVisible(false);
        setInputName('');  // 清空输入
        fetchRoomData();   // 刷新数据
      } else {
        message.error(response.data.message || '入住失败');
      }
    } catch (error) {
      console.error('入住失败:', error);
      message.error(error.response?.data?.message || '入住失败');
    }
  };

  const handleCheckInCancel = () => {
    setIsCheckInModalVisible(false);
  };

  const handleFeeModalCancel = () => {
    setIsFeeModalVisible(false);
  };

  // 退房处理函数
  const handleCheckOut = (record) => {
    const token = localStorage.getItem('token');
    console.log('token:', token);
    Modal.confirm({
      title: '确认办理退房？',
      content: (
        <div>
          <p>房间号: {record.roomId}</p>
          <p>顾客: {record.people?.map(p => p.peopleName).join(', ')}</p>
        </div>
      ),
      onOk: async () => {
        try {
          const response = await axios.get(`http://${Host}:${Port}/stage/delete`, {
            params: { roomId: record.roomId }, // 查询参数放到 params
            headers: {
              'Authorization': `Bearer ${token}` // 请求头放到 headers
            }
          }
          );

          if (response.data.code === 0) {
            message.success('退房成功');
            fetchRoomData();
          } else {
            message.error(response.data.message || '退房失败');
          }
        } catch (error) {
          console.error('退房失败:', error);
          message.error('退房失败');
        }
      },
      // 添加样式定位
      style: { top: '30%' },
    });
  };


  // 在 CheckInPage 组件内添加打印函数
  const handlePrint = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // 创建包含标题和房间信息的元素
      const headerDiv = document.createElement('div');
      headerDiv.style.fontFamily = '"Microsoft YaHei", Arial, sans-serif';
      headerDiv.style.textAlign = 'center';
      headerDiv.style.padding = '10px';
      headerDiv.innerHTML = `
        <div style="font-size: 140px; font-weight: bold; margin-bottom: 20px;">波普特酒店费用详单</div>
        <div style="font-size: 80px; color: #666;">
          房间号：${selectedRoom?.roomId} &nbsp;&nbsp;
          房间类型：${selectedRoom?.roomLevel}
        </div>
      `;
      document.body.appendChild(headerDiv);
      
      // 将标题转换为图片
      const headerCanvas = await html2canvas(headerDiv);
      document.body.removeChild(headerDiv);
  
      // 转换主内容
      const element = document.getElementById('fee-modal-content');
      const contentCanvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // 添加标题和房间信息图片到PDF
      const headerWidth = 170; // 增加宽度以适应更多内容
      const headerHeight = headerCanvas.height * headerWidth / headerCanvas.width;
      pdf.addImage(
        headerCanvas.toDataURL('image/jpeg'), 
        'JPEG', 
        (pdf.internal.pageSize.width - headerWidth) / 2, // 水平居中
        10, // 距离顶部10mm
        headerWidth, 
        headerHeight
      );
      
      // 添加主要内容
      const contentWidth = 170;
      const contentHeight = contentCanvas.height * contentWidth / contentCanvas.width;
      pdf.addImage(
        contentCanvas.toDataURL('image/jpeg', 1.0), 
        'JPEG', 
        20, // 左边距20mm
        headerHeight + 20, // 标题下方20mm处
        contentWidth, 
        contentHeight
      );
      
      pdf.save(`房间${selectedRoom?.roomId}费用详单.pdf`);
      message.success('费用详单已保存为PDF');
    } catch (error) {
      console.error('生成PDF失败:', error);
      message.error('生成PDF失败');
    }
  };

  const showFeeDetailsModal = (record) => {
    axios.get(`http://${Host}:${Port}/stage/record?roomId=${record.roomId}`)
      .then(response => {
        const { data } = response;
        if (data.code === 0) {
          // 处理空调费用数据
          const acRecords = data.data.records.map(record => ({
            startTime: record.time,
            changedSetting: `开关: ${record.power === "on" ? "开" : "关"}, 温度: ${record.temperature}°C, 风速: ${record.windSpeed}, 模式: ${record.mode}, 扫风: ${record.sweep}`,
            costPerHour: record.windSpeed === '高' ? 1 : record.windSpeed === '中' ? 0.5 : 0.33, // 需要根据具体规则实现此函数
            stageCost: record.cost
          }));

          // 计算总费用
          const totalAcCost = data.data.cost;

          // 计算房费
          const roomFee = record.checkInTime
            ? calculateRoomFee(record.checkInTime, record.roomLevel)
            : 0;

          setSelectedRoom({
            ...record,
            people: data.data.people
          });
          setTotalCost(totalAcCost);
          setRoomFee(roomFee); // 设置房费
          setFeeData(acRecords);
          setIsFeeModalVisible(true);
        } else {
          message.error(data.message || '获取费用详情失败');
        }
      })
      .catch(error => {
        console.error('Error fetching fee details:', error);
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
      title: '计费 (元/分钟)',
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
      dataIndex: 'roomLevel',
      key: 'roomLevel',
      width: '12%',
      filters: [
        { text: '标准间', value: ROOM_TYPES.STANDARD },
        { text: '大床房', value: ROOM_TYPES.LARGE },
      ],
      onFilter: (value, record) => record.roomLevel === value,
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
      // dataIndex: 'people',
      key: 'people',
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
      onFilter: (value, record) => {
        // 修改筛选逻辑
        return record.people?.some(person =>
          person.peopleName.toLowerCase().includes(value.toLowerCase())
        ) || false;
      },
      // 修改渲染逻辑
      render: (_, record) => {
        if (!record.people || record.people.length === 0) return '-';
        return (
          <span className="text-base">
            <UserOutlined className="mr-2" />
            {record.people.map(p =>
              `${p.peopleName[0]}${'*'.repeat(p.peopleName.length - 1)}`
            ).join(', ')}
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
      dataIndex: 'cost',
      key: 'cost',
      width: '12%',
      render: (fee) => (
        <Tag color="green" className="px-3 py-1.5 text-base">
          ¥ {fee}
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
              onClick={handlePrint}
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
          <div id="fee-modal-content" className="space-y-4 bg-white p-6">
            {/* 费用摘要卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">房间类型</div>
                  <div className="text-lg font-medium text-gray-800">
                    {selectedRoom?.roomLevel}
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
                    {selectedRoom?.people?.map(p => p.peopleName).join(', ') || '-'}
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
                    title: '计费 (元/分钟)',
                    dataIndex: 'costPerHour',
                    key: 'costPerHour',
                    width: '15%',
                    render: (cost) => (
                      <div className="text-gray-600">
                        ¥ {formatAmount(cost)}
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