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

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const CentralControl = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 总控状态（仅展示）
  const [globalMode, setGlobalMode] = useState('cooling'); // 'cooling' or 'heating'
  const [globalFanSpeed, setGlobalFanSpeed] = useState('low'); // 'low', 'medium', 'high'
  const [resourceLimit, setResourceLimit] = useState(0); // 资源数
  const [lowSpeedRate, setLowSpeedRate] = useState(1); // 低速费率
  const [midSpeedRate, setMidSpeedRate] = useState(2); // 中速费率
  const [highSpeedRate, setHighSpeedRate] = useState(3); // 高速费率

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsRes, settingsRes] = await Promise.all([
          axios.get(`http://${Host}:${Port}/api/rooms`),
          axios.get(`http://${Host}:${Port}/api/settings`),
        ]);

        const combinedData = roomsRes.data.map((room) => {
          const setting = settingsRes.data.find((s) => s.id === room.roomId);
          return {
            roomId: room.roomId,
            checkedIn: room.checkedIn,
            airConditionerOn: setting ? setting.isOn : false,
            mode: setting ? setting.mode : 'N/A',
            temperature: setting ? setting.temperature : 0,
            coolingHeatingMode: setting ? setting.coolingHeatingMode : 'N/A',
            totalFee: room.checkedIn ? 0 : 0,
          };
        });

        setRoomData(combinedData);
        setLoading(false);
      } catch (error) {
        message.error('获取房间数据失败');
        console.error('数据获取错误:', error);
      }
    };

    fetchData();
  }, []);

  const calculateTotalFee = async (roomId) => {
    try {
      const res = await axios.get(`http://${Host}:${Port}/api/calculateFee/${roomId}`);
      return res.data.totalFee;
    } catch (error) {
      console.error('费用获取错误:', error);
      return 0;
    }
  };

  useEffect(() => {
    const updateRoomDataWithFees = async () => {
      const updatedData = await Promise.all(
        roomData.map(async (room) => {
          if (room.checkedIn) {
            const fee = await calculateTotalFee(room.roomId);
            return { ...room, totalFee: fee };
          }
          return { ...room, totalFee: 0 };
        })
      );
      setRoomData(updatedData);
    };

    if (!loading && roomData.length > 0) {
      updateRoomDataWithFees();
    }
  }, [loading]);

  const columns = [
    {
      title: '房间号',
      dataIndex: 'roomId',
      key: 'roomId',
      align: 'center',
      render: (roomId) => (
        <Tag className="bg-blue-100 text-blue-800 border-0 text-base px-3 py-1">{roomId}</Tag>
      ),
    },
    {
      title: '是否入住',
      dataIndex: 'checkedIn',
      key: 'checkedIn',
      align: 'center',
      render: (checkedIn) =>
        checkedIn ? (
          <Tag icon={<CheckCircleOutlined />} className="bg-green-100 text-green-800 border-0">
            已入住
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} className="bg-gray-100 text-gray-800 border-0">
            空闲房间
          </Tag>
        ),
    },
    {
      title: '空调开关',
      dataIndex: 'airConditionerOn',
      key: 'airConditionerOn',
      align: 'center',
      render: (airConditionerOn) =>
        airConditionerOn ? (
          <Tag icon={<PoweroffOutlined />} className="bg-blue-100 text-blue-800 border-0">
            On
          </Tag>
        ) : (
          <Tag icon={<PoweroffOutlined />} className="bg-gray-100 text-gray-800 border-0">
            Off
          </Tag>
        ),
    },
    {
      title: '模式',
      dataIndex: 'coolingHeatingMode',
      key: 'coolingHeatingMode',
      align: 'center',
      render: (coolingHeatingMode) => {
        const modeMap = {
          cooling: '制冷',
          heating: '制热',
        };
        return (
          <Tag
            className={
              coolingHeatingMode === 'cooling' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
            }
          >
            {modeMap[coolingHeatingMode] || ''}
          </Tag>
        );
      },
    },
    {
      title: '累计费用 (¥)',
      dataIndex: 'totalFee',
      key: 'totalFee',
      align: 'center',
      render: (totalFee) => `${totalFee} ¥`,
    },
    {
      title: '功能',
      key: 'operation',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => {
                localStorage.setItem('roomId', record.roomId);
                navigate("/home/feeDetails");
              }}
            />
          </Tooltip>
          <Tooltip title="修改">
            <Button
              type="default"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => {
                localStorage.setItem('roomId', record.roomId);
                navigate("/home/controlpanel");
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
              onChange={(value) => setGlobalMode(value)}
              style={{ width: 100 }}
            >
              <Option value="cooling">制冷</Option>
              <Option value="heating">制热</Option>
            </Select>
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">空调可用资源数 :</span>
            <InputNumber
              min={0}
              value={resourceLimit}
              onChange={(value) => setResourceLimit(value)}
              style={{ width: 80 }}
            />
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">低风速费率 :</span>
            <InputNumber
              min={0}
              value={lowSpeedRate}
              onChange={(value) => setLowSpeedRate(value)}
              style={{ width: 80 }}
            />
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">中风速费率 :</span>
            <InputNumber
              min={0}
              value={midSpeedRate}
              onChange={(value) => setMidSpeedRate(value)}
              style={{ width: 80 }}
            />
          </div>
          <Divider type="vertical" className="h-8 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">高风速费率 :</span>
            <InputNumber
              min={0}
              value={highSpeedRate}
              onChange={(value) => setHighSpeedRate(value)}
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
