import React from 'react'
import './App.css'
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import WelcomePage from './pages/WelcomePage'
import ControlPanelPage from './pages/ControlPanelPage';
import FeeDetailPage from './pages/FeeDetailPage';
import ProfilePage from './pages/ProfilePage';
import CentralControl from './pages/CentralControl';
import CheckInPage from './pages/CheckInPage';
// import SignupPage from './pages/SignupPage';
// import MainLayout from './layouts/MainLayout';
// import ProfilePage from './pages/ProfilePage';
// import DataListingPage from './pages/DataListingPage';
// import RecordsPage from './pages/RecordsPage';

const App = () => {
  const [userRole, setUserRole] = useState(null); // 初始化用户权限为空
  const [isLoading, setIsLoading] = useState(true); // 新增 isLoading 用于检测是否完成加载

  useEffect(() => {
    const role = localStorage.getItem('role'); // 从 localStorage 获取权限信息
    setUserRole(role);
    setIsLoading(false); // 设置加载完成
  }, []);
  // 如果加载还没完成，显示加载指示器，避免直接渲染页面
  if (isLoading) {
    return <div>Loading...</div>;  // 你可以在这里放一个更好的加载指示器
  }


  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* 登录页面路由 */}
          <Route path="/" element={<LoginPage />} />

          {/* MainLayout 包含的所有路由 */}
          <Route element={<MainLayout />}>
            {/* 公开访问的空调控制面板路由 */}
            <Route path="/room/:roomId" element={<ControlPanelPage />} />

            {/* 需要登录验证的路由 */}
            {userRole ? (
              <Route path="/home">
                <Route index element={<WelcomePage />} />
                <Route path="feeDetails" element={<FeeDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="centralControl" element={<CentralControl />} />
                <Route path="checkIn" element={<CheckInPage />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/" />} />
            )}
          </Route>
        </Routes>
      </BrowserRouter>

    </>
  );
};

export default App
