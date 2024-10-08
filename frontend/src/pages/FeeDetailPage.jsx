import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const FeeDetailsPage = () => {
  const [data, setData] = useState([]);
  const [role, setRole] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const id = localStorage.getItem('roomId');


  useEffect(() => {
    axios.get(`http://${Host}:${Port}/api/feeDetails/` + id)
      .then(response => {
        const historyData = response.data;

        // 计算每条记录的阶段费用
        const calculatedData = historyData.map((record, index) => {
          const currentStartTime = moment(record.startTime);
          let nextStartTime;

          // 判断changedSetting 是否为 isOn:false
          if (record.changedSetting==='isOn: false') {
            // 如果空调关闭，阶段费用直接为 0
            return {
              ...record,
              stageCost: 0,
              costPerHour: 0,
            }; 
          } else {
            // 如果没有关闭空调，且有下一条记录，取下一条的 startTime
            if (historyData[index + 1]) {
              nextStartTime = moment(historyData[index + 1].startTime);
            } else {
              // 否则动态计算最后一条记录的费用
              return {
                ...record,
                stageCost: null, // 设置为null，在渲染时动态计算
              };
            }
          }

          // 计算时间差（小时）
          const durationInHours = nextStartTime.diff(currentStartTime, 'hours', true); // true to get float

          // 计算阶段费用
          const stageCost = (durationInHours * record.costPerHour).toFixed(2);

          return {
            ...record,
            stageCost, // 添加计算的阶段费用
          };
        });

        setData(calculatedData); // 更新状态
      })
      .catch(error => {
        message.error('获取费用详情失败');
      });
  }, []);

  // 动态计算最后一条记录的阶段费用
  const calculateDynamicStageCost = (record) => {
    const startTime = moment(record.startTime);
    const currentTime = moment(); // 当前时间
    const durationInHours = currentTime.diff(startTime, 'hours', true); // 计算当前时间与开始时间的差值（小时）

    // 返回动态计算的阶段费用
    return (durationInHours * record.costPerHour).toFixed(2);
  };

  // 列定义
  const columns = [
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
      render: (_, record) => {
        // 如果是最后一条记录，动态计算费用
        if (record.stageCost === null) {
          return calculateDynamicStageCost(record);
        }
        // 否则直接渲染已经计算好的费用
        return record.stageCost;
      },
    },
  ];

  // 计算当前总费用（包括动态计算的最后一条记录）
  const totalCost = Array.isArray(data)
  ? data.reduce((sum, record) => {
      // 如果 stageCost 是 null，则说明它需要动态计算
      if (record.stageCost === null) {
        // 但如果 changedSetting 为 isOn:false，则 stageCost 应该是 0，不再计算
        if (record.changedSetting && record.changedSetting.isOn === false) {
          return sum;
        }
        return sum + parseFloat(calculateDynamicStageCost(record));
      }
      return sum + parseFloat(record.stageCost || 0); // 正常情况直接加上 stageCost
    }, 0).toFixed(2)
  : 0;


  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>费用明细</span>
          {role !== 'room' && (
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => setIsModalVisible(true)}  // 改为控制 Modal 显示
            >
              查看费用详单
            </Button>
          )}
        </div>
      }
      bordered={false}
      style={{ margin: '24px' }}
    >
      <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      <div style={{ marginTop: '16px', fontWeight: 'bold', fontSize: '16px' }}>
        当前总费用: {totalCost} 元
      </div>

      <Modal
        title="费用详单"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Table columns={columns} dataSource={data} pagination={false} />
      </Modal>

    </Card>
  );
};

export default FeeDetailsPage;
