import React from 'react';
import { Row, Col } from 'antd';

const ConsumptionPanel = ({ cost = 12.06, totalCost = 24.12 }) => {
  // 将金额格式化为两位小数
  const formatAmount = (amount) => Number(amount).toFixed(2);
  
  return (
    <Row gutter={16} align="middle">
      <Col span={12}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
        }}>
          <div style={{
            fontSize: '13px',
            color: '#8c8c8c',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            总消费金额
          </div>
          <div style={{
            fontSize: '26px',
            color: '#1890ff',
            fontWeight: 'bold',
            lineHeight: '1.2'
          }}>
            ¥ {formatAmount(totalCost * 5)} {/* 假设每度电5元 */}
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '12px',
              color: '#8c8c8c',
              marginBottom: '4px'
            }}>
              最近一次消费
            </div>
            <div>
              <span style={{
                color: '#52c41a',
                fontSize: '15px',
                fontWeight: '500'
              }}>
                ¥ {formatAmount(cost * 5)} {/* 假设每度电5元 */}
              </span>
              {/* <span style={{
                fontSize: '12px',
                color: '#bfbfbf',
                marginLeft: '8px'
              }}>
                (2小时前)
              </span> */}
            </div>
          </div>
        </div>
      </Col>

      <Col span={12}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
        }}>
          <div style={{
            fontSize: '13px',
            color: '#8c8c8c',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            总耗电量
          </div>
          <div style={{
            fontSize: '26px',
            color: '#1890ff',
            fontWeight: 'bold',
            lineHeight: '1.2'
          }}>
            {formatAmount(totalCost)}
            <span style={{
              fontSize: '16px',
              marginLeft: '4px',
              fontWeight: '500'
            }}>
              kW·h
            </span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '12px',
              color: '#8c8c8c',
              marginBottom: '4px'
            }}>
              最近耗电量
            </div>
            <div>
              <span style={{
                color: '#52c41a',
                fontSize: '15px',
                fontWeight: '500'
              }}>
                {formatAmount(cost)} kW·h
              </span>
              {/* <span style={{
                fontSize: '12px',
                color: '#bfbfbf',
                marginLeft: '8px'
              }}>
                (2小时前)
              </span> */}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default ConsumptionPanel;