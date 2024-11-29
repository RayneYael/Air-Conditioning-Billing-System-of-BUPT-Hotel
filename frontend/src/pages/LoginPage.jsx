import React, { useState, } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/image.png'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { message } from 'antd';

const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const saveToken = (token,username,role) => {
  localStorage.clear();
  localStorage.setItem('token', token); 
  localStorage.setItem('username', username);
  localStorage.setItem('roomId', username);
  localStorage.setItem('role', role);
};

const LoginPage = () => {
    const navigate = useNavigate();

    const [values,setValues] = useState({
        username:'',
        password:''
    })
    const handleChange = (event) => {
        setValues(prev => ({...prev, [event.target.name]: event.target.value}))
    }

    const handleSubmit = async (event) => {
      event.preventDefault();
      
      try {
        // 发送异步请求
        const res = await axios.post(`http://${Host}:${Port}/admin/login`, values);
        // 返回值中code为0表示成功，否则表示失败, message中包含错误信息
        if (res.data.code === 1){
          // antd提醒message.error(res.data.message);
          message.error(res.data.message);
          return;
        }
        // 保存 token 等信息
        saveToken(res.data.token, values.username, res.data.role);

        // 立即跳转到 /home
        navigate('/home');
        // toast.success(`${values.username}, 登录成功`);
      } catch (err) {
        // 处理错误
        // toast.error(`登录失败：${err.response?.data?.error || '未知错误'}`);
        toast.error(err);
        console.log(err);
      }
    };
    
    
  
    
    
  return (
    <>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="MedicalDataSys"
            src={ logo }
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
           波普特廉价酒店空调计费系统
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form action="#" onSubmit={handleSubmit} method="POST" className="space-y-6">
            <div>
            <div className="flex items-center justify-between">
             <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                房间号/id
             </label>
            </div>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="username"
                  required
                  autoComplete="username"
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  密码
                </label>
                <div className="text-sm">

                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                登录
              </button>
              <ToastContainer />
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default LoginPage