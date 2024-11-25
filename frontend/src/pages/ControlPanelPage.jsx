import React, { useState, useEffect, useRef } from 'react';
import { message, Switch, Slider, Select, Card, Row, Col, Button, Progress, } from 'antd'; // 使用 Ant Design 的组件
import { PoweroffOutlined } from '@ant-design/icons'; // 添加一个开关图标
import axios from 'axios';
import "../App.css"
import WeatherModule from './WeatherModule'; // 引入天气模块
import ConsumptionPanel from './ConsumptionPanel'; // 引入计费模块


const { Option } = Select;
const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;


const ControlPanelPage = () => {
  const [roomTemperature, setRoomTemperature] = useState(24); // 温度初始为24度
  const [power, setPower] = useState(false); // 开关状态
  const [temperature, setTemperature] = useState(26); // 温度初始为26度
  const [windSpeed, setWindSpeed] = useState('低'); // 风速初始为低
  const [mode, setMode] = useState('制冷'); // 制冷或制热模式
  const [sweep, setSweep] = useState(false);
  const [cost, setCost] = useState(12.06);
  const [totalCost, setTotalCost] = useState(24.12);

  const snowflakeContainer = useRef(null);  // 用于获取雪花的容器引用

  const roomId = localStorage.getItem('roomId');

  // 页面加载时从数据库获取当前的设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 使用查询参数的方式请求 API
        const response = await axios.get(`http://${Host}:${Port}/api/controlPanelSettings`, {
          params: {
            roomId: roomId
          }
        });

        // 检查响应格式
        if (response.data.code === 0) {  // 添加响应码检查
          const settings = response.data.data;  // 从 data 字段获取设置数据
          if (settings) {
            // 使用数据库中的值更新状态
            setRoomTemperature(settings.roomTemperature || 24);
            setPower(settings.power === 'on');
            setTemperature(settings.temperature || 26);
            setWindSpeed(settings.windSpeed || '低');
            setMode(settings.mode || '制冷');
            setSweep(settings.sweep === '开');
            setCost(settings.cost || 12.06);
            setTotalCost(settings.totalCost || 24.12);
          } else {
            message.warning('未找到房间设置，使用默认值');
            // 使用默认值
            setDefaultSettings();
          }
        } else {
          message.error(response.data.message || '获取设置失败');
          setDefaultSettings();
        }
      } catch (error) {
        message.error('获取设置失败，使用默认设置');
        console.error('获取设置错误:', error);
        setDefaultSettings();
      }
    };

    // 提取默认设置到一个函数
    const setDefaultSettings = () => {
      setRoomTemperature(24);
      setPower(false);
      setTemperature(26);
      setWindSpeed('低');
      setMode('制冷');
      setSweep(false);
      setCost(12.06);
      setTotalCost(24.12);
    };

    fetchSettings();
  }, [roomId]);

  // 动态生成雪花
  useEffect(() => {
    const container = snowflakeContainer.current;

    if (power && mode === '制冷') {
      // 创建生成雪花的定时器
      const snowflakeInterval = setInterval(() => {
        let targetCount = 20; // 默认雪花数量

        if (windSpeed === '低') {
          targetCount = 30; // 风速低时的雪花数量
        } else if (windSpeed === '中') {
          targetCount = 60; // 风速中等时的雪花数量
        } else if (windSpeed === '高') {
          targetCount = 120; // 风速高时的雪花数量
        }

        const currentSnowflakes = container.children.length;

        // 如果当前雪花数量不足，则增加
        if (currentSnowflakes < targetCount) {
          const snowflake = document.createElement('div');
          snowflake.className = 'snowflake';

          // 生成左边、中间、右边的不同区域
          const leftPosition = Math.random();
          if (leftPosition < 0.1) {
            // 10% 的雪花生成在最左侧 10% 的区域
            snowflake.style.left = `${Math.random() * 10}%`;
          } else if (leftPosition > 0.9) {
            // 10% 的雪花生成在最右侧 10% 的区域
            snowflake.style.left = `${90 + Math.random() * 10}%`;
          } else {
            // 80% 的雪花生成在中间的 80% 区域
            snowflake.style.left = `${10 + Math.random() * 80}%`;
          }

          snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;

          // 创建两条额外的对角线条
          const line1 = document.createElement('div');
          line1.className = 'line1';
          const line2 = document.createElement('div');
          line2.className = 'line2';

          // 将额外的线条加入雪花
          snowflake.appendChild(line1);
          snowflake.appendChild(line2);

          container.appendChild(snowflake);
        }
        // 如果当前雪花数量过多，则平滑移除多余的
        if (currentSnowflakes > targetCount) {
          for (let i = currentSnowflakes; i > targetCount; i--) {
            const snowflake = container.children[i - 1];
            snowflake.style.opacity = 0; // 逐渐隐藏

            // 等到动画结束后再移除
            setTimeout(() => {
              if (snowflake.parentNode) {
                snowflake.parentNode.removeChild(snowflake);
              }
            }, 1000); // 1s后移除雪花
          }
        }
      }, 10); // 每10ms检查并生成新的雪花

      // 清除定时器
      return () => clearInterval(snowflakeInterval);
    } else if (container) {
      // 如果是制热模式或空调关闭，逐步减少雪花数量
      const currentSnowflakes = container.children.length;

      const reduceSnowflakes = setInterval(() => {
        if (container.children.length > 0) {
          container.removeChild(container.lastChild);
        } else {
          clearInterval(reduceSnowflakes); // 当所有雪花移除完毕后，停止减少
        }
      }, 100); // 每100ms移除一个雪花，创建一个平滑的减少效果
    }
  }, [power, mode, windSpeed]);



  // 实时更新数据库中的设置
  const updateSettings = (newSettings) => {
    // 构建完整的请求数据，包含roomId
    const requestData = {
      roomId: roomId,  // 从localStorage获取的roomId
      ...newSettings   // 展开其他设置参数
    };

    // 发送POST请求
    axios.post(`http://${Host}:${Port}/api/controlPanelSettings`, requestData)
      .then(response => {
        // 检查响应状态
        if (response.data.code === 0) {
          message.success('设置已更新');
        } else {
          message.error(response.data.message || '更新设置失败');
        }
      })
      .catch(error => {
        message.error('更新设置失败');
        console.error(error);
      });
  };

  // 开关控制
  const handleSwitch = (checked) => {
    setPower(checked);
    updateSettings({
      power: checked ? 'on' : 'off',
      temperature: temperature,
      windSpeed: windSpeed,
      sweep: sweep ? '开' : '关'
    });
  }

  // 温度调节：只更新 UI，不更新数据库
  const handleTemperatureChange = (value) => {
    setTemperature(value);  // 实时更新 UI 显示温度
  };

  // 温度调节后更新
  const handleTemperatureAfterChange = (value) => {
    updateSettings({
      power: power ? 'on' : 'off',
      temperature: value,
      windSpeed: windSpeed,
      sweep: sweep ? '开' : '关'
    });
  };

  // 风速调节
  const handleWindSpeedChange = (value) => {
    setWindSpeed(value);
    updateSettings({
      power: power ? 'on' : 'off',
      temperature: temperature,
      windSpeed: value,
      sweep: sweep ? '开' : '关'
    });
  };

  // 设置扫风模式
  const handleSweep = (value) => {
    setSweep(value);
    updateSettings({
      power: power ? 'on' : 'off',
      temperature: temperature,
      windSpeed: windSpeed,
      sweep: value ? '开' : '关'
    });
  };

  // 设置制冷或制热模式
  const handleCoolingHeatingChange = (value) => {
    setMode(value);
    updateSettings({
      power: power ? 'on' : 'off',
      temperature: temperature,
      windSpeed: windSpeed,
      sweep: sweep ? '开' : '关',
      mode: value
    });
  };

  // 根据空调状态（开/关、制冷/制热）动态改变背景颜色
  const getBackgroundStyle = () => {
    if (!power) {
      return {
        background: 'linear-gradient(to right, #e0e0e0, #cfcfcf)'
      };
    } else if (mode === '制热') {
      return {
        background: 'linear-gradient(to right, #ff7e5f, #feb47b)',
        transition: 'background 1.5s ease-in-out'
      };
    } else {
      return {
        background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
        transition: 'background 1.5s ease-in-out'
      };
    }
  };


  return (
    <div style={{ position: 'relative', height: '90vh', overflow: 'hidden' }}>

      {/* 雪花容器始终存在，通过动态调整雪花数量来控制效果 */}
      <div ref={snowflakeContainer} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: power && mode === '制冷' ? 1 : 0, // 控制雪花是否显示
        transition: 'opacity 1s ease' // 平滑过渡显示与隐藏
      }}>
        <div className="snowflake">
          <div className="line1"></div>
          <div className="line2"></div>
        </div>
      </div>

      {/* 低风速制热模式下的热浪线条 */}
      {power && mode === '制热' && windSpeed === '低' && (
        <>
          <div className="heat-wave-line-normal" style={{ top: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ top: '35px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ bottom: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ bottom: '35px', zIndex: 1, pointerEvents: 'none' }}></div>
        </>
      )}


      {/* 中风速制热模式下的热浪线条 */}
      {power && mode === '制热' && windSpeed === '中' && (
        <>
          <div className="heat-wave-line-strong" style={{ top: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-strong" style={{ top: '40px', zIndex: 1, pointerEvents: 'none' }}></div>

          <div className="heat-wave-line-strong" style={{ bottom: '40px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-strong" style={{ bottom: '60px', zIndex: 1, pointerEvents: 'none' }}></div>

        </>
      )}

      {/* 高风速制热模式下的热浪线条 */}
      {power && mode === '制热' && windSpeed === '高' && (
        <>
          <div className="heat-wave-line-strong" style={{ top: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-strong" style={{ top: '40px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-strong" style={{ top: '60px', zIndex: 1, pointerEvents: 'none' }}></div>

          <div className="heat-wave-line-strong" style={{ bottom: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-strong" style={{ bottom: '40px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-strong" style={{ bottom: '60px', zIndex: 1, pointerEvents: 'none' }}></div>

        </>
      )}

      {/* 装饰图形 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '100px',
        height: '100px',
        backgroundColor: '#1890ff',
        borderRadius: '50%',
        opacity: 0.2, // 让装饰图形不至于太抢眼
        zIndex: 1, // 确保装饰图形在背景层，UI在其上
      }}>
      </div>

      {/* 装饰图形 */}
      <div style={{
        position: 'absolute',
        top: '75%',
        left: '85%',
        width: '100px',
        height: '100px',
        backgroundColor: '#1890ff',
        borderRadius: '50%',
        opacity: 0.2, // 让装饰图形不至于太抢眼
        zIndex: 1, // 确保装饰图形在背景层，UI在其上
      }}>
      </div>


      <Row justify="center" align="middle"
        style={{
          height: '90vh',
          ...getBackgroundStyle(), // 根据制冷/制热模式动态切换背景颜色
          position: 'relative',
        }}>
        <Col xs={26} sm={22} md={18} lg={14} xl={12}>
          <Card
            title={<span style={{ fontSize: '22px' }}>空调控制面板</span>}  // 增大字体
            bordered={false}
            style={{
              width: '100%',
              backgroundColor: power ? 'rgba(255, 255, 255, 0.9)' : 'rgba(180, 180, 180, 0.3)', // 空调关闭时变暗
              borderRadius: '15px', // 让卡片有圆角效果，增加柔和感
              padding: '10px', // 让内容有更多内边距，看起来更宽敞
              filter: power ? 'none' : 'brightness(0.7)', // 关闭时降低亮度
              transition: 'background-color 0.5s ease, filter 0.5s ease', // 添加过渡效果
              zIndex: 2  // 添加更高的 z-index
            }}
          >

            {/* 温度和图标显示 */}
            {/* 温度显示区域 */}
            <Row justify="center" align="middle" style={{ marginTop: '0px', marginBottom: '24px', position: 'relative' }}>
              <Col style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative' }}>
                  {/* 主温度显示圈 */}
                  <Progress
                    type="circle"
                    percent={(temperature - 16) * (100 / (30 - 16))}
                    format={() => (
                      power ? ( // 只在开机状态显示温度信息
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            marginBottom: '2px'
                          }}>
                            室温
                          </span>
                          <span style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#000000d9',
                            lineHeight: '1'
                          }}>
                            {roomTemperature}°C
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            marginTop: '4px'
                          }}>
                            设定: {temperature}°C
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '14px',
                          color: '#00000040'  // 关机时显示较暗的"关"字
                        }}>

                        </span>
                      )
                    )}
                    width={130}
                    strokeColor={
                      power
                        ? (mode === '制冷' ? '#1890ff' : '#f5222d')
                        : 'rgba(128, 128, 128, 0.5)'
                    }
                  />


                  <WeatherModule />

                  {/* 图标在空调开启时才显示 */}
                  {power && (
                    <>
                      {/* 制冷/制热图标，放在进度条的左上角 */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '-38px',
                      }}>
                        {mode === '制冷' ? (
                          <i className="fas fa-snowflake" style={{ fontSize: '24px', color: '#1890ff' }}></i>
                        ) : (
                          <i className="fas fa-fire" style={{ fontSize: '24px', color: '#f5222d' }}></i>
                        )}
                      </div>

                      {/* 风速指示图标，放在进度条的右上角 */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '-38px',
                      }}>
                        {/* 根据制冷或制热模式显示不同的风速图标 */}
                        {mode === '制冷' ? (
                          <>
                            {windSpeed === '低' && (
                              <img src="/风速1-冷.png" alt="低风速(制冷)" style={{ width: '26px', height: '26px' }} />
                            )}
                            {windSpeed === '中' && (
                              <img src="/风速2-冷.png" alt="中风速(制冷)" style={{ width: '26px', height: '26px' }} />
                            )}
                            {windSpeed === '高' && (
                              <img src="/风速3-冷.png" alt="高风速(制冷)" style={{ width: '26px', height: '26px' }} />
                            )}
                          </>
                        ) : (
                          <>
                            {windSpeed === '低' && (
                              <img src="/风速1-热.png" alt="低风速(制热)" style={{ width: '26px', height: '26px' }} />
                            )}
                            {windSpeed === '中' && (
                              <img src="/风速2-热.png" alt="中风速(制热)" style={{ width: '26px', height: '26px' }} />
                            )}
                            {windSpeed === '高' && (
                              <img src="/风速3-热.png" alt="高风速(制热)" style={{ width: '26px', height: '26px' }} />
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Col>
            </Row>



            {/* 开关控制 */}
            <Row gutter={16} align="middle" justify="center"
              style={{
                marginBottom: '24px',
                transition: '0.3s ease', // 添加平滑的过渡动画
              }}>
              <Col>
                <Button
                  type="primary"
                  onClick={() => handleSwitch(!power)}  // 点击按钮时，切换开关状态
                  icon={<PoweroffOutlined />}  // 添加电源图标
                  style={{
                    backgroundColor: power ? '#d32f2f' : '#1890ff',  // 根据状态设置颜色
                    borderColor: power ? '#d32f2f' : '#1890ff',
                    color: '#fff',
                    width: '80px',  // 设定宽度
                    height: '60px',  // 设定高度和宽度一致
                    borderRadius: '30%',  // 圆形按钮
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {power ? '关' : '开'} {/* 根据状态显示文字 */}
                </Button>
              </Col>
            </Row>


            {/* 制冷/制热模式选择 */}
            <Row
              gutter={16}
              align="middle"
              justify="space-between"
              style={{
                marginBottom: '24px',
                opacity: power ? 1 : 0,  // 使用 opacity 控制可见性
                pointerEvents: power ? 'auto' : 'none',  // 当 power 为 false 时禁用交互
                transition: 'opacity 0.3s ease',  // 添加平滑的过渡效果
              }}
            >
              <Col>
                <span className="mr-2 text-lg">制冷/制热模式:</span>
              </Col>
              <Col>
                <Button.Group>
                  <Button
                    type={mode === '制冷' ? 'primary' : 'default'}
                    style={{
                      backgroundColor: mode === '制冷' ? '#1890ff' : '#fff', // 蓝色
                      color: mode === '制冷' ? '#fff' : '#000', // 文字颜色
                    }}
                    onClick={() => handleCoolingHeatingChange('制冷')}
                  >
                    制冷
                  </Button>
                  <Button
                    type={mode === '制热' ? 'primary' : 'default'}
                    style={{
                      backgroundColor: mode === '制热' ? '#f5222d' : '#fff', // 红色
                      color: mode === '制热' ? '#fff' : '#000', // 文字颜色
                    }}
                    onClick={() => handleCoolingHeatingChange('制热')}
                  >
                    制热
                  </Button>
                </Button.Group>
              </Col>
            </Row>

            {/* 温度调节 */}
            <Row
              gutter={16}
              align="middle"
              justify="space-between"
              style={{
                marginBottom: '24px',
                opacity: power ? 1 : 0,
                pointerEvents: power ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
              }}
            >
              <Col>
                <span className="mr-2 text-lg">温度设置：</span>
              </Col>
              <Col span={12}>
                <Slider
                  min={16}
                  max={30}
                  value={temperature}
                  onChange={handleTemperatureChange}  // 实时更新 UI，但不发送请求
                  onAfterChange={handleTemperatureAfterChange}  // 用户松开后发送请求
                  marks={{ 16: '16°C', 30: '30°C' }}
                />
              </Col>
            </Row>

            {/* 风速调节 */}
            <Row
              gutter={16}
              align="middle"
              justify="space-between"
              style={{
                marginBottom: '24px',
                opacity: power ? 1 : 0,
                pointerEvents: power ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
              }}
            >
              <Col>
                <span className="mr-2 text-lg">风速调节:</span>
              </Col>
              <Col justify="end">
                <Button.Group>
                  <Button
                    type={windSpeed === '低' ? 'primary' : 'default'}
                    onClick={() => handleWindSpeedChange('低')}
                  >
                    低
                  </Button>
                  <Button
                    type={windSpeed === '中' ? 'primary' : 'default'}
                    onClick={() => handleWindSpeedChange('中')}
                  >
                    中
                  </Button>
                  <Button
                    type={windSpeed === '高' ? 'primary' : 'default'}
                    onClick={() => handleWindSpeedChange('高')}
                  >
                    高
                  </Button>
                </Button.Group>
              </Col>
            </Row>

            {/* 添加扫风开关 */}
            <Row
              gutter={16}
              align="middle"
              justify="space-between"
              style={{
                marginBottom: '24px',
                opacity: power ? 1 : 0,
                pointerEvents: power ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
              }}
            >
              <Col>
                <span className="mr-2 text-lg">扫风模式:</span>
              </Col>
              <Col>
                <Switch
                  checked={sweep}
                  onChange={(checked) => handleSweep(checked)}
                  style={{
                    backgroundColor: sweep ? (mode === '制冷' ? '#1890ff' : '#f5222d') : 'rgba(0, 0, 0, 0.25)'
                  }}
                />
              </Col>
            </Row>

            {/* 显示消费金额和电量 */}
            <ConsumptionPanel cost={cost} totalCost={totalCost} />

          </Card>
        </Col>
      </Row>
    </div >
  );
};

export default ControlPanelPage;
