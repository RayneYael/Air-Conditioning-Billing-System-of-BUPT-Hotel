import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Tooltip, Space, Input, Select, InputNumber, Form, Divider, message } from 'antd';
import {
  CheckCircleOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PoweroffOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;

const Host = import.meta.env.VITE_DEV_SERVER_HOST;
const Port = import.meta.env.VITE_API_PORT;

const CentralControl = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 总控状态
  const [globalMode, setGlobalMode] = useState('heating'); // 'cooling' or 'heating'
  const [globalFanSpeed, setGlobalFanSpeed] = useState('low'); // 'low', 'medium', 'high'
  const [resourceLimit, setResourceLimit] = useState(0); // 资源数
  const [lowSpeedRate, setLowSpeedRate] = useState(1); // 低速费率
  const [midSpeedRate, setMidSpeedRate] = useState(2); // 中速费率
  const [highSpeedRate, setHighSpeedRate] = useState(3); // 高速费率

  

  // 更新中央空调设置
  const updateCentralSettings = async (updatedSettings) => {
    try {
      
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `http://${Host}:${Port}/central-aircon/adjust`,
        {
          mode: updatedSettings.mode === 'cooling' ? 0 : 1, // Convert mode to number
          resourceLimit: updatedSettings.resourceLimit,
          fanRates: {
            lowSpeedRate: updatedSettings.lowSpeedRate,
            midSpeedRate: updatedSettings.midSpeedRate,
            highSpeedRate: updatedSettings.highSpeedRate
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        message.success('设置更新成功');
        return true;
      } else {
        message.error(response.data.message || '设置更新失败');
        return false;
      }
    } catch (error) {
      message.error('设置更新失败: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };

  // Event handlers for setting changes
  const handleModeChange = async (value) => {
    const success = await updateCentralSettings({
      mode: value,
      resourceLimit,
      lowSpeedRate,
      midSpeedRate,
      highSpeedRate
    });
    if (success) setGlobalMode(value);
  };

  const handleResourceLimitChange = async (value) => {
    const success = await updateCentralSettings({
      mode: globalMode,
      resourceLimit: value,
      lowSpeedRate,
      midSpeedRate,
      highSpeedRate
    });
    if (success) setResourceLimit(value);
  };

  const handleLowSpeedRateChange = async (value) => {
    const success = await updateCentralSettings({
      mode: globalMode,
      resourceLimit,
      lowSpeedRate: value,
      midSpeedRate,
      highSpeedRate
    });
    if (success) setLowSpeedRate(value);
  };

  const handleMidSpeedRateChange = async (value) => {
    const success = await updateCentralSettings({
      mode: globalMode,
      resourceLimit,
      lowSpeedRate,
      midSpeedRate: value,
      highSpeedRate
    });
    if (success) setMidSpeedRate(value);
  };

  const handleHighSpeedRateChange = async (value) => {
    const success = await updateCentralSettings({
      mode: globalMode,
      resourceLimit,
      lowSpeedRate,
      midSpeedRate,
      highSpeedRate: value
    });
    if (success) setHighSpeedRate(value);
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log(token)
        const response = await axios.get(`http://${Host}:${Port}/aircon/status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });

        if (response.data.code === 0) {
          // 处理每条记录，确保数值类型正确
          const processedData = response.data.data.map(room => ({
            roomId: room.roomId,
            // checkedIn: room.checkedIn ?? false,
            power: room.power === 'on',
            windSpeed: room.windSpeed,
            mode: room.mode,
            roomTemperature: parseInt(room.roomTemperature),
            temperature: parseInt(room.temperature),
            totalFee: parseFloat(room.totalCost).toFixed(2),
            checkedIn: room.checkedIn
          }));
          setRoomData(processedData);
        } else {
          message.error(response.data.message || '获取房间数据失败');
        }
        setLoading(false);
      } catch (error) {
        message.error('获取房间数据失败');
        console.error('数据获取错误:', error);
        setLoading(false);
      }
    };

  // 立即执行一次
  fetchData();

  // 设置定时器，每秒执行一次
  const timer = setInterval(fetchData, 1000);

  // 组件卸载时清除定时器
  return () => {
    clearInterval(timer);
  };
}, []);


  // const calculateTotalFee = async (roomId) => {
  //   try {
  //     const res = await axios.get(`http://${Host}:${Port}/api/calculateFee/${roomId}`);
  //     return res.data.totalFee;
  //   } catch (error) {
  //     console.error('费用获取错误:', error);
  //     return 0;
  //   }
  // };

  // useEffect(() => {
  //   const updateRoomDataWithFees = async () => {
  //     const updatedData = await Promise.all(
  //       roomData.map(async (room) => {
  //         if (room.checkedIn) {
  //           const fee = await calculateTotalFee(room.roomId);
  //           return { ...room, totalFee: fee };
  //         }
  //         return { ...room, totalFee: 0 };
  //       })
  //     );
  //     setRoomData(updatedData);
  //   };

  //   if (!loading && roomData.length > 0) {
  //     updateRoomDataWithFees();
  //   }
  // }, [loading]);

  const columns = [
    {
      title: '房间号',
      dataIndex: 'roomId',
      key: 'roomId',
      width: 120, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (roomId) => (
        <Tag className="bg-blue-100 text-blue-800 border-0 text-base px-3 py-1">{roomId}</Tag>
      ),
    },
    // {
    //   title: '是否入住',
    //   dataIndex: 'checkedIn',
    //   key: 'checkedIn',
    //   width: 120, // 设置列宽
    //   align: 'center',
    //   className: 'text-base font-medium',
    //   render: (checkedIn) =>
    //     checkedIn ? (
    //       <Tag icon={<CheckCircleOutlined />} className="bg-green-100 text-green-800 border-0 text-base px-3 py-1">
    //         已入住
    //       </Tag>
    //     ) : (
    //       <Tag icon={<CloseCircleOutlined />} className="bg-gray-100 text-gray-800 border-0 text-base px-3 py-1">
    //         空闲房间
    //       </Tag>
    //     ),
    // },
    {
      title: '空调开关',
      dataIndex: 'power',
      key: 'power',
      width: 120, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (power) =>
        power ? (
          <Tag icon={<PoweroffOutlined />} className="bg-blue-100 text-blue-800 border-0 text-base px-3 py-1">
            开启
          </Tag>
        ) : (
          <Tag icon={<PoweroffOutlined />} className="bg-gray-100 text-gray-800 border-0 text-base px-3 py-1">
            关闭
          </Tag>
        ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      width: 100, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (mode) => (
        <Tag
          className={`${mode === '制冷' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
            } text-base px-3 py-1 border-0`}
        >
          {mode}
        </Tag>
      ),
    },
    {
      title: '风速',
      dataIndex: 'windSpeed',
      key: 'windSpeed',
      width: 70, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (windSpeed) => <span className="text-base">{windSpeed}</span>,
    },
    {
      title: '房间温度',
      dataIndex: 'roomTemperature',
      key: 'roomTemperature',
      width: 100, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (temp) => <span className="text-base">{temp}°C</span>,
    },
    {
      title: '目标温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (temp) => <span className="text-base">{temp}°C</span>,
    },
    {
      title: '累计费用 (¥)',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 120, // 设置列宽
      align: 'center',
      className: 'text-base font-medium',
      render: (totalFee) => <span className="text-base">{totalFee} ¥</span>,
    },
    {
      title: '功能',
      key: 'operation',
      width: 120, // 设置列宽
      fixed: 'right', // 可以固定在右侧
      align: 'center',
      className: 'text-base font-medium',
      render: (_, record) => (
        <Space size="middle">
          {/* <Tooltip title="查看详情">
            <Button
              type="primary"
              shape="circle"
              size="middle"
              icon={<EyeOutlined />}
              onClick={() => {
                localStorage.setItem('roomId', record.roomId);
                // navigate("/home/feeDetails");
              }}
            />
          </Tooltip> */}
          <Tooltip title="修改">
            <Button
              type="default"
              shape="circle"
              size="middle"
              icon={<EditOutlined />}
              onClick={() => {
                // localStorage.setItem('roomId', record.roomId);
                navigate(`/room/${record.roomId}`);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50">
      {/* 总控模块 */}
      <div className="bg-white p-6 mb-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <SettingOutlined className="mr-2 text-blue-500 text-2xl" />
          空调总控设置
        </h3>
        <div className="flex flex-wrap items-center gap-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">模式:</span>
            <Select
              value={globalMode}
              onChange={handleModeChange}
              style={{ width: 100 }}
            >
              <Option value="cooling">制冷</Option>
              <Option value="heating">制热</Option>
            </Select>
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">空调可用资源数:</span>
            <InputNumber
              min={0}
              value={resourceLimit}
              onChange={handleResourceLimitChange}
              style={{ width: 80 }}
            />
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">低风速费率:</span>
            <InputNumber
              min={0}
              value={lowSpeedRate}
              onChange={handleLowSpeedRateChange}
              style={{ width: 80 }}
            />
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">中风速费率:</span>
            <InputNumber
              min={0}
              value={midSpeedRate}
              onChange={handleMidSpeedRateChange}
              style={{ width: 80 }}
            />
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">高风速费率:</span>
            <InputNumber
              min={0}
              value={highSpeedRate}
              onChange={handleHighSpeedRateChange}
              style={{ width: 80 }}
            />
          </div>
        </div>
      </div>


      {/* 房间列表 */}
      <div className="bg-white rounded-lg shadow-lg">
        <Table
          columns={columns}
          dataSource={roomData}
          pagination={{ pageSize: 10 }}
          loading={loading}
          className="border rounded-lg"
        />
      </div>
    </div>
  );
};

export default CentralControl;
