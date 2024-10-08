import React, { useEffect, useState } from 'react';
import { Card, Descriptions } from 'antd';

const ProfilePage = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    // 从 localStorage 中获取数据
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');

    // 设置数据
    setUsername(storedUsername || '未知用户');  // 默认显示未知用户
    setRole(storedRole || '未知权限');  // 默认显示未知权限
  }, []);

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <Card
        title="员工信息"
        bordered={true}
        style={{ maxWidth: '800px', width: '100%' }}  // 调整卡片大小
      >
        <Descriptions
          bordered
          column={1}
          title=""
          layout="horizontal"
          labelStyle={{ width: '200px' }}  // 调整标签宽度
        >
          <Descriptions.Item label="用户名">
            {username}
          </Descriptions.Item>
          <Descriptions.Item label="用户权限">
            {role}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProfilePage;
