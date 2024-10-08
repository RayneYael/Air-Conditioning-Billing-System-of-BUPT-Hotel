import React, { useState } from 'react';
import { Layout, Select, ConfigProvider } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
// import enUS from 'antd/es/locale/en_US';
// import zhCN from 'antd/es/locale/zh_CN';

const { Content, Footer } = Layout;
const { Option } = Select;

const WelcomePage = () => {
  // 欢迎语
  const welcomeMessage =  '欢迎使用系统！';

  return (

    <div className="p-6 flex items-center justify-center w-full h-full">
      <div className="bg-white bg-opacity-90 p-16 rounded shadow-md text-center w-full max-w-4xl min-h-[500px] flex flex-col justify-center">
        <h1 className="text-4xl font-bold mb-4">欢迎来到空调计费系统</h1>
        <p className="text-lg">这是您的仪表盘</p>
      </div>
    </div>

  );
};
export default WelcomePage;
