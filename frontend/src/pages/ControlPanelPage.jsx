import React, { useState, useEffect } from 'react';
import { message, Switch, Slider, Select, Card, Row, Col } from 'antd'; // 使用 Ant Design 的组件
import { PoweroffOutlined } from '@ant-design/icons'; // 添加一个开关图标
import axios from 'axios'; 

const { Option } = Select;
const Host = import.meta.env.VITE_HOST;
const Port = import.meta.env.VITE_API_PORT;

const ControlPanelPage = () => {
  const [isOn, setIsOn] = useState(false); // 开关状态
  const [temperature, setTemperature] = useState(26); // 温度初始为26度（节能模式）
  const [windSpeed, setWindSpeed] = useState('low'); // 风速初始为低（节能模式）
  const [mode, setMode] = useState('energySaving'); // 运行模式初始为节能模式
  const [coolingHeatingMode, setCoolingHeatingMode] = useState('cooling'); // 制冷或制热模式
  
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

  // 温度调节
  const handleTemperatureChange = (value) => {
    setTemperature(value);
    const newSettings = { 
      temperature: value, 
      // mode: 'custom', 
      // isOn, 
      // windSpeed, 
      // coolingHeatingMode
    };
    updateSettings(newSettings);
  };

  // 风速调节
  const handleWindSpeedChange = (value) => {
    setWindSpeed(value);
    const newSettings = { 
      windSpeed: value, 
      // mode: 'custom', 
      // isOn, 
      // temperature, 
      // coolingHeatingMode 
    };
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
    const newSettings = { 
      coolingHeatingMode: value, 
      // isOn, 
      // temperature, 
      // windSpeed, 
      // mode 
    };
    updateSettings(newSettings);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <Card
          title="空调控制面板"
          bordered={false}
          style={{ width: '100%', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
        >
          {/* 开关控制 */}
          <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
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
                    onChange={handleTemperatureChange}
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
  );
};

export default ControlPanelPage;
