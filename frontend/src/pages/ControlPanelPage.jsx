import React, { useState, useEffect, useRef } from 'react';
import { message, Switch, Slider, Select, Card, Row, Col } from 'antd'; // 使用 Ant Design 的组件
import { PoweroffOutlined } from '@ant-design/icons'; // 添加一个开关图标
import axios from 'axios';
import "../App.css"

const { Option } = Select;
const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const ControlPanelPage = () => {
  const [isOn, setIsOn] = useState(false); // 开关状态
  const [temperature, setTemperature] = useState(26); // 温度初始为26度（节能模式）
  const [windSpeed, setWindSpeed] = useState('low'); // 风速初始为低（节能模式）
  const [mode, setMode] = useState('energySaving'); // 运行模式初始为节能模式
  const [coolingHeatingMode, setCoolingHeatingMode] = useState('cooling'); // 制冷或制热模式

  const snowflakeContainer = useRef(null);  // 用于获取雪花的容器引用

  const id = localStorage.getItem('roomId');
  // 页面加载时从数据库获取当前的设置
  useEffect(() => {
    axios.get(`http://${Host}:${Port}/api/controlPanelSettings/` + id)
      .then(response => {
        const settings = response.data;
        setIsOn(!!settings.isOn);
        setTemperature(settings.temperature);
        setWindSpeed(settings.windSpeed);
        setMode(settings.mode);
        setCoolingHeatingMode(settings.coolingHeatingMode);
      })
      .catch(error => {
        message.error('获取设置失败');
        console.error(error);
      });
  }, []);

  // 动态生成雪花
  useEffect(() => {
    const container = snowflakeContainer.current;

    if (isOn && coolingHeatingMode === 'cooling') {
      // 创建生成雪花的定时器
      const snowflakeInterval = setInterval(() => {
        let targetCount = 20; // 默认雪花数量

        // 如果当前模式是强效制冷，增加雪花数量
        if (mode === 'strongCooling') {
          targetCount = 50; // 增加雪花数量
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
  }, [isOn, coolingHeatingMode, mode]);



  // 实时更新数据库中的设置
  const updateSettings = (newSettings) => {
    axios.post(`http://${Host}:${Port}/api/controlPanelSettings/` + id, newSettings)
      .then(() => {
        message.success('设置已更新');
      })
      .catch(error => {
        message.error('更新设置失败');
        console.error(error);
      });
  };

  // 预设模式的温度和风速
  const modeSettings = {
    energySaving: { temperature: 26, windSpeed: 'low' },
    strongCooling: { temperature: 18, windSpeed: 'medium' },
    forcedHeating: { temperature: 28, windSpeed: 'medium' },
  };

  // 开关控制，开机时默认切换到节能模式
  const handleSwitch = (checked) => {
    setIsOn(checked);
    const newSettings = {
      isOn: checked,
      mode: 'energySaving',
      temperature: modeSettings.energySaving.temperature,
      windSpeed: modeSettings.energySaving.windSpeed,
      coolingHeatingMode: 'cooling'
    };
    if (checked) {
      setMode('energySaving');
      setCoolingHeatingMode('cooling');
      setTemperature(modeSettings.energySaving.temperature);
      setWindSpeed(modeSettings.energySaving.windSpeed);
    }
    updateSettings(newSettings); // 实时更新数据库
  };


  // 温度调节：只更新 UI，不更新数据库
  const handleTemperatureChange = (value) => {
    setTemperature(value);  // 实时更新 UI 显示温度
  };

  // 用户停止滑动后更新数据库
  const handleTemperatureAfterChange = (value) => {
    // 当用户停止滑动时才更新数据库
    updateSettings({
      temperature: value,
      // mode: 'custom', 
      // isOn, 
      // windSpeed, 
      // coolingHeatingMode
    });
  };

  // 风速调节
  const handleWindSpeedChange = (value) => {
    setWindSpeed(value);
    let newSettings = {
      windSpeed: value,
      // mode: 'custom', 
      // isOn, 
      // temperature, 
      // coolingHeatingMode 
    };

    // 如果当前模式是强效制冷或强效加热，切换为自定义模式
    if ((mode === 'strongCooling' || mode === 'forcedHeating') && value == 'low') {
      setMode('custom'); // 切换为自定义模式
      newSettings.mode = 'custom';
    }

    setWindSpeed(value);
    updateSettings(newSettings);
  };

  // 模式选择时，自动设置对应的温度和风速
  const handleModeChange = (value) => {
    setMode(value); // 更新当前模式

    // 初始化设置对象
    let newSettings = {
      mode: value,
      // temperature: modeSettings[value].temperature, 
      // windSpeed: modeSettings[value].windSpeed, 
      // isOn, 
      // coolingHeatingMode 
    };

    if (value !== 'custom') {
      const settings = modeSettings[value]; // 获取该模式下的预设值
      setTemperature(settings.temperature);
      setWindSpeed(settings.windSpeed);
    }

    // 根据模式自动切换制冷/制热
    if (value === 'strongCooling') {
      setCoolingHeatingMode('cooling'); // 切换到制冷模式
      // newSettings.coolingHeatingMode = 'cooling'; // 更新 coolingHeatingMode 到 newSettings
    } else if (value === 'forcedHeating') {
      setCoolingHeatingMode('heating'); // 切换到制热模式
      // newSettings.coolingHeatingMode = 'heating'; // 更新 coolingHeatingMode 到 newSettings
    }

    // 更新设置并同步到数据库
    updateSettings(newSettings);
  };

  // 设置制冷或制热模式
  const handleCoolingHeatingChange = (value) => {
    setCoolingHeatingMode(value);
    let newSettings = {
      coolingHeatingMode: value,
      // isOn, 
      // temperature, 
      // windSpeed, 
      // mode 
    };

    // 如果当前模式是强效制冷或强效加热，切换模式为自定义
    if (mode === 'strongCooling' && value === 'heating') {
      setMode('custom'); // 切换为自定义模式
      newSettings.mode = 'custom';
    } else if (mode === 'forcedHeating' && value === 'cooling') {
      setMode('custom'); // 切换为自定义模式
      newSettings.mode = 'custom';
    }

    updateSettings(newSettings);
  };

  // 根据空调状态（开/关、制冷/制热）动态改变背景颜色
  const getBackgroundStyle = () => {
    if (!isOn) {
      return {
        background: 'linear-gradient(to right, #e0e0e0, #cfcfcf)'
      };
    } else if (coolingHeatingMode === 'heating') {
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
        opacity: isOn && coolingHeatingMode === 'cooling' ? 1 : 0, // 控制雪花是否显示
        transition: 'opacity 1s ease' // 平滑过渡显示与隐藏
      }}>
        <div className="snowflake">
          <div className="line1"></div>
          <div className="line2"></div>
        </div>
      </div>

      {/* 普通制热模式下的热浪线条 */}
      {isOn && coolingHeatingMode === 'heating' && mode !== 'forcedHeating' && (
        <>
          <div className="heat-wave-line-normal" style={{ top: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ top: '30px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ top: '40px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ bottom: '20px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ bottom: '30px', zIndex: 1, pointerEvents: 'none' }}></div>
          <div className="heat-wave-line-normal" style={{ bottom: '40px', zIndex: 1, pointerEvents: 'none' }}></div>
        </>
      )}

      {/* 强效制热模式下的热浪线条 */}
      {isOn && coolingHeatingMode === 'heating' && mode === 'forcedHeating' && (
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
            title="空调控制面板"
            bordered={false}
            style={{
              height: '55vh',
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)', // 白色半透明背景，保持UI清晰
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // 添加阴影增强层次感
              borderRadius: '15px', // 让卡片有圆角效果，增加柔和感
              padding: '20px', // 让内容有更多内边距，看起来更宽敞

            }}

          >
            {/* 开关控制 */}
            <Row gutter={16} align="middle" justify="space-between"
              style={{
                marginBottom: '24px',
                transition: '0.3s ease', // 添加平滑的过渡动画
              }}>
              <Col>
                <span className="mr-2 text-lg">空调开关:</span>
              </Col>
              <Col>
                <Switch
                  checkedChildren="开"
                  unCheckedChildren="关"
                  checked={isOn}
                  onChange={handleSwitch}
                  style={{ width: '80px', backgroundColor: !isOn ? '#1890ff' : '#f5222d' }}
                  icon={<PoweroffOutlined />}
                />
              </Col>
            </Row>

            {/* 制冷/制热模式选择 */}
            {isOn && (
              <>
                <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
                  <Col>
                    <span className="mr-2 text-lg">制冷/制热模式:</span>
                  </Col>
                  <Col>
                    <Switch
                      checkedChildren="制冷"
                      unCheckedChildren="制热"
                      checked={coolingHeatingMode === 'cooling'}
                      onChange={(checked) => handleCoolingHeatingChange(checked ? 'cooling' : 'heating')}
                      style={{ width: '80px', backgroundColor: coolingHeatingMode === 'cooling' ? '#1890ff' : '#f5222d' }}
                    />
                  </Col>
                </Row>

                {/* 温度调节 */}
                <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
                  <Col>
                    <span className="mr-2 text-lg">温度设置: {temperature} °C</span>
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

                {/* 模式选择 */}
                <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
                  <Col>
                    <span className="mr-2 text-lg">运行模式选择:</span>
                  </Col>
                  <Col span={12}>
                    <Select value={mode} onChange={handleModeChange} style={{ width: '100%' }}>
                      <Option value="energySaving">节能模式</Option>
                      <Option value="strongCooling">强效制冷</Option>
                      <Option value="forcedHeating">强效加热</Option>
                      <Option value="custom">自定义模式</Option>
                    </Select>
                  </Col>
                </Row>

                {/* 风速调节 */}
                <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
                  <Col>
                    <span className="mr-2 text-lg">风速调节:</span>
                  </Col>
                  <Col span={12}>
                    <Select value={windSpeed} onChange={handleWindSpeedChange} style={{ width: '100%' }}>
                      <Option value="low">低</Option>
                      <Option value="medium">中</Option>
                      <Option value="high">高</Option>
                    </Select>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ControlPanelPage;
