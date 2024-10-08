import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Tooltip, Space, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, SearchOutlined, CloseCircleOutlined, EditOutlined, EyeOutlined, PoweroffOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const CentralControl = () => {
  const navigate = useNavigate(); 
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); 
        const [roomsRes, settingsRes] = await Promise.all([
          axios.get(`http://${Host}:${Port}/api/rooms`),  
          axios.get(`http://${Host}:${Port}/api/settings`) 
        ]);

        const combinedData = roomsRes.data.map(room => {
          const setting = settingsRes.data.find(s => s.id === room.roomId); 
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
      console.log('Fee data for room:', roomId, res.data);  // 添加调试输出
      return res.data.totalFee; // 确认返回的数据结构
    } catch (error) {
      console.error('费用获取错误:', error);
      return 0;
    }
  };
  
  

  useEffect(() => {
    const updateRoomDataWithFees = async () => {
      const updatedData = await Promise.all(
        roomData.map(async room => {
          if (room.checkedIn) {
            // 调用后端API获取费用
            const fee = await calculateTotalFee(room.roomId);  // 传入 roomId
            return { ...room, totalFee: fee };
          }
          return { ...room, totalFee: 0 };  // 未入住的房间费用为 0
        })
      );
      setRoomData(updatedData);
    };

    if (!loading && roomData.length > 0) {  
      updateRoomDataWithFees();  // 当房间数据加载完成时调用
    }
  }, [loading]); 

  const columns = [
    {
      title: '房间号',
      dataIndex: 'roomId',
      key: 'roomId',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索房间号"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            搜索
          </Button>
          <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
            重置
          </Button>
        </div>
      ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) => record.roomId.toString().includes(value),
      render: (roomId) => <Tag color="blue">{roomId}</Tag>,
    },
    {
        title: '是否入住',
        dataIndex: 'checkedIn',
        key: 'checkedIn',
        filters: [
          { text: '已入住', value: 1 },
          { text: '空闲房间', value: 0 },
        ],
        onFilter: (value, record) => {
        //   console.log('Value for checkedIn filter:', value);
        //   console.log('Record checkedIn value:', record.checkedIn);
          return record.checkedIn === value; 
        },
        render: (checkedIn) =>
          checkedIn ? (
            <Tag icon={<CheckCircleOutlined />} color="green">已入住</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="red">空闲房间</Tag>
          ),
      },
      {
        title: '空调开关',
        dataIndex: 'airConditionerOn',
        key: 'airConditionerOn',
        filters: [
          { text: 'On', value: 1 },
          { text: 'Off', value: 0 },
        ],
        onFilter: (value, record) => {
        //   console.log('Value for airConditionerOn filter:', value);
        //   console.log('Record airConditionerOn value:', record.airConditionerOn);
          return record.airConditionerOn === value;
        },
        render: (airConditionerOn) =>
          airConditionerOn ? (
            <Tag icon={<PoweroffOutlined />} color="green">On</Tag>
          ) : (
            <Tag icon={<PoweroffOutlined />} color="red">Off</Tag>
          ),
      },    
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode) => mode ? mode : '',
    },
    {
      title: '设定温度 (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (temperature) => temperature ? `${temperature} °C` : '',
    },
    {
      title: '累计费用 (¥)',
      dataIndex: 'totalFee',
      key: 'totalFee',
      render: (totalFee) => `${totalFee} ¥`,
    },
    {
      title: '功能',
      key: 'operation',
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
    <div style={{ padding: '24px' }}>
      <Table columns={columns} dataSource={roomData} pagination={{ pageSize: 10 }} loading={loading} />
    </div>
  );
};

export default CentralControl;
