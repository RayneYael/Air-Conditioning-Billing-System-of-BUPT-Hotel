import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal } from 'antd';
import { ExportOutlined, ClockCircleOutlined, SettingOutlined, DollarOutlined, HomeOutlined } from '@ant-design/icons';
import moment from 'moment';
import { ROOM_TYPES, calculateRoomFee, getRoomType, formatAmount } from '../utils/roomUtils';

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const FeeDetailsPage = () => {
  const [data, setData] = useState([]);
  const [role, setRole] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [roomFee, setRoomFee] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const id = localStorage.getItem('roomId');

  useEffect(() => {
    fetch(`http://${Host}:${Port}/stage/record?roomId=${id}`)
    .then(res => res.json())
    .then(response => {
        if (response.code === 0) {
          // 处理空调费用数据
          const acRecords = response.data.records.map(record => ({
            startTime: record.time,
            changedSetting: `温度: ${record.temperature}°C, 风速: ${record.windSpeed}, 模式: ${record.mode}, 扫风: ${record.sweep}`,
            costPerHour: record.windSpeed === '高' ? 1 : record.windSpeed === '中' ? 0.5 : 0.33,
            stageCost: record.cost
          }));
 
          // 计算总费用
          const totalAcCost = response.data.cost;
          const calculatedRoomFee = calculateRoomFee(record.checkInTime, record.roomLevel);
 
          setTotalCost(totalAcCost);
          setRoomFee(calculatedRoomFee);
        } else {
          message.error(response.message || '获取费用详情失败');
        }
      })
      .catch(error => {
        console.error('Error fetching fee details:', error);
        message.error('获取费用详情失败');
      });
  }, [id]);


  const columns = [
    {
      title: (
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <ClockCircleOutlined />
          <span>开始时间</span>
        </div>
      ),
      dataIndex: 'startTime',
      key: 'startTime',
      align: 'center',
      width: '30%',
      render: (startTime) => (
        <div className="text-gray-600 bg-gray-50 py-2 px-3 rounded">
          {moment(startTime).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <SettingOutlined />
          <span>修改设置</span>
        </div>
      ),
      dataIndex: 'changedSetting',
      key: 'changedSetting',
      align: 'center',
      width: '20%',
      render: (setting) => (
        <div className={`py-2 px-3 rounded ${
          setting === 'isOn: false' 
            ? 'bg-red-50 text-red-600' 
            : 'bg-green-50 text-green-600'
        }`}>
          {setting}
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <DollarOutlined />
          <span>每小时费用</span>
        </div>
      ),
      dataIndex: 'costPerHour',
      key: 'costPerHour',
      align: 'center',
      width: '20%',
      render: (cost) => (
        <div className="bg-gray-50 py-2 px-3 rounded">
          ¥{cost}/小时
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <DollarOutlined />
          <span>阶段费用</span>
        </div>
      ),
      dataIndex: 'stageCost',
      key: 'stageCost',
      align: 'center',
      width: '20%',
      render: (_, record) => {
        const cost = record.stageCost === null ? calculateDynamicStageCost(record) : record.stageCost;
        return (
          <div className="bg-blue-50 text-blue-600 font-medium py-2 px-3 rounded">
            ¥{cost}
          </div>
        );
      },
    },
  ];

  // return (
  //   <div className="p-6 bg-gray-50 min-h-screen">
  //     <Card
  //       title={
  //         <div className="flex justify-between items-center py-2">
  //           <span className="text-xl font-medium text-gray-800">费用明细</span>
  //           {role !== 'room' && (
  //             <Button
  //               type="default"
  //               icon={<ExportOutlined />}
  //               onClick={() => setIsModalVisible(true)}
  //               className="border-gray-300 hover:border-gray-400"
  //             >
  //               查看费用详单
  //             </Button>
  //           )}
  //         </div>
  //       }
  //       bordered={false}
  //       className="shadow-lg rounded-xl"
  //     >
  //       <div className="grid grid-cols-4 gap-4 mb-6">
  //         <div className="bg-gray-50 p-4 rounded-lg">
  //           <div className="text-sm text-gray-500 text-center mb-1">房间号</div>
  //           <div className="text-2xl font-medium text-gray-800 text-center">{id}</div>
  //         </div>
  //         <div className="bg-green-50 p-4 rounded-lg">
  //           <div className="text-sm text-gray-500 text-center mb-1">酒店费用</div>
  //           <div className="text-2xl font-medium text-green-600 text-center">¥ {formatAmount(roomFee)}</div>
  //         </div>
  //         <div className="bg-blue-50 p-4 rounded-lg">
  //           <div className="text-sm text-gray-500 text-center mb-1">空调费用</div>
  //           <div className="text-2xl font-medium text-blue-600 text-center">¥ {formatAmount(totalCost)}</div>
  //         </div>
  //         <div className="bg-purple-50 p-4 rounded-lg">
  //           <div className="text-sm text-gray-500 text-center mb-1">总费用</div>
  //           <div className="text-2xl font-medium text-purple-600 text-center">¥ {formatAmount(Number(roomFee) + Number(totalCost))}</div>
  //         </div>
  //       </div>

  //       <Table 
  //         columns={columns} 
  //         dataSource={data}
  //         rowKey="key"
  //         pagination={{ 
  //           pageSize: 8,
  //           className: "mt-4" 
  //         }}
  //         className="border rounded-lg shadow-sm bg-white"
  //         rowClassName="hover:bg-gray-50"
  //       />

  //       <Modal
  //         title={<span className="text-xl font-medium text-gray-800">费用详单</span>}
  //         open={isModalVisible}
  //         onCancel={() => setIsModalVisible(false)}
  //         width={900}
  //         footer={[
  //           <Button 
  //             key="close" 
  //             onClick={() => setIsModalVisible(false)}
  //             className="hover:bg-gray-100"
  //           >
  //             关闭
  //           </Button>
  //         ]}
  //         className="rounded-lg"
  //       >
  //         <div className="grid grid-cols-4 gap-4 my-6">
  //           <div className="bg-gray-50 p-4 rounded-lg text-center">
  //             <div className="text-sm text-gray-500 mb-1">房间号</div>
  //             <div className="text-xl font-medium text-gray-800">{id}</div>
  //           </div>
  //           <div className="bg-green-50 p-4 rounded-lg text-center">
  //             <div className="text-sm text-gray-500 mb-1">酒店费用</div>
  //             <div className="text-xl font-medium text-green-600">¥ {formatAmount(roomFee)}</div>
  //           </div>
  //           <div className="bg-blue-50 p-4 rounded-lg text-center">
  //             <div className="text-sm text-gray-500 mb-1">空调费用</div>
  //             <div className="text-xl font-medium text-blue-600">¥ {formatAmount(totalCost)}</div>
  //           </div>
  //           <div className="bg-purple-50 p-4 rounded-lg text-center">
  //             <div className="text-sm text-gray-500 mb-1">总费用</div>
  //             <div className="text-xl font-medium text-purple-600">¥ {formatAmount(Number(roomFee) + Number(totalCost))}</div>
  //           </div>
  //         </div>
  //         <Table 
  //           columns={columns} 
  //           dataSource={data}
  //           rowKey="key"
  //           pagination={false}
  //           className="border rounded-lg" 
  //         />
  //       </Modal>
  //     </Card>
  //   </div>
  // );
};

export default FeeDetailsPage;