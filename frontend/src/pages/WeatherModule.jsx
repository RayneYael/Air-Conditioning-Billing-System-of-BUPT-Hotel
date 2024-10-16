import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeatherModule = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await axios.get(
                    'https://devapi.qweather.com/v7/weather/now?location=116.30,39.95&key=6960f54c71e441a18b728e23cc519d09'
                );
                setWeatherData(response.data);
                setLoading(false);
            } catch (err) {
                console.error('请求失败：', err);
                setError('无法获取天气数据');
                setLoading(false);
            }
        };
        fetchWeatherData();
    }, []);

    // 如果数据还在加载或者有错误，显示相应信息
    if (loading) return <p>加载中...</p>;
    if (error) return <p>{error}</p>;

    // 确保 weatherData 和 weatherData.now 存在再渲染
    if (!weatherData || !weatherData.now) return <p>无法获取天气数据</p>;

    // 动态生成类名
    const iconClassName = `qi-${weatherData.now.icon}`;

    const iconColor = weatherData.now.text.includes('晴') ? '#f5a623' : '#4a4a4a';  // 晴天用黄色，其他用灰色

    return (
        <>
            {/* 左侧天气信息部分 */}
            <div
                style={{
                    position: 'absolute',
                    top: '15px',
                    left: '-210px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px', // 行间距微调为10px
                    padding: '12px 15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // 微增强阴影
                }}
            >
                {/* 天气情况部分 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <i
                        className={iconClassName}
                        style={{
                            color: iconColor, fontSize: '28px', marginRight: '12px',
                        }}
                    ></i>
                    <span style={{ fontSize: '16px', marginRight: '8px', fontWeight: 'bold' }}>
                        {weatherData.now.text}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {weatherData.now.temp}°C
                    </span>
                </div>

                {/* 湿度部分 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <i
                        className="qi-399"
                        style={{ color: '#1296db', fontSize: '28px', marginRight: '12px' }}
                    ></i>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {weatherData.now.humidity}%
                    </span>
                </div>
            </div>

            {/* 右侧风速信息部分 */}
            <div
                style={{
                    position: 'absolute',
                    top: '15px',
                    right: '-210px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '10px', // 控制每行之间的间距
                    padding: '18px 25px 15px 20px', // 上 右 下 左
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // 微增强阴影
                }}
            >
                {/* 风向部分 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '8px' }}>
                        风向:
                    </span>
                    <span style={{ fontSize: '16px' }}>{weatherData.now.windDir}</span>
                </div>

                {/* 风速部分 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '8px' }}>
                        风速:
                    </span>
                    <span style={{ fontSize: '16px' }}>{weatherData.now.windSpeed} km/h</span>
                </div>

                {/* 能见度部分 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '8px' }}>
                        能见度:
                    </span>
                    <span style={{ fontSize: '16px' }}>{weatherData.now.vis} km</span>
                </div>
            </div>
        </>
    );




};

export default WeatherModule;
