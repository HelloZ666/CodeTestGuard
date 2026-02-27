import React from 'react';
import { Card, Table, Tag, Typography, Alert, Statistic, Row, Col } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { AIAnalysis, AICost } from '../../types';

const { Text } = Typography;

interface AISuggestionsProps {
  analysis: AIAnalysis | null;
  cost: AICost | null;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ analysis, cost }) => {
  if (!analysis) {
    return (
      <Card title="AI 分析建议" style={{ marginBottom: 16 }}>
        <Text type="secondary">未使用AI分析</Text>
      </Card>
    );
  }

  if (analysis.error) {
    return (
      <Card title="AI 分析建议" style={{ marginBottom: 16 }}>
        <Alert type="warning" title="AI分析异常" description={analysis.error} showIcon />
      </Card>
    );
  }

  const riskColors: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'green',
  };

  const suggestedColumns = [
    { title: '用例ID', dataIndex: 'test_id', key: 'test_id', width: 80 },
    { title: '测试功能', dataIndex: 'test_function', key: 'test_function', width: 160 },
    { title: '测试步骤', dataIndex: 'test_steps', key: 'test_steps', ellipsis: true },
    { title: '预期结果', dataIndex: 'expected_result', key: 'expected_result', ellipsis: true },
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>
            ✨ AI 智能建议
          </span>
        </div>
      } 
      style={{ marginBottom: 16, border: '1px solid rgba(118, 75, 162, 0.2)' }}
    >
      {/* 风险评估 */}
      {analysis.risk_assessment && (
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 12 }}>
          <Text strong style={{ fontSize: 16, marginRight: 12 }}>风险评估等级:</Text>
          <Tag 
            color={riskColors[analysis.risk_assessment] || 'default'} 
            style={{ fontSize: 14, padding: '4px 12px', fontWeight: 700 }}
          >
            {analysis.risk_assessment.toUpperCase()}
          </Tag>
        </div>
      )}

      {/* 覆盖缺口 */}
      {analysis.coverage_gaps && (
        <Alert
          type="info"
          icon={<WarningOutlined style={{ color: '#2193b0' }} />}
          message={<span style={{ fontWeight: 600, color: '#2193b0' }}>覆盖缺口分析</span>}
          description={analysis.coverage_gaps}
          style={{ marginBottom: 24, background: 'rgba(33, 147, 176, 0.05)', border: '1px solid rgba(33, 147, 176, 0.2)' }}
          showIcon
        />
      )}

      {/* 建议补充的测试用例 */}
      {analysis.suggested_test_cases && analysis.suggested_test_cases.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 4, height: 20, background: 'linear-gradient(to bottom, #667eea, #764ba2)', borderRadius: 2, marginRight: 8 }}></div>
            <Text strong style={{ fontSize: 16 }}>建议补充用例</Text>
          </div>
          <Table
            dataSource={analysis.suggested_test_cases}
            columns={suggestedColumns}
            rowKey="test_id"
            pagination={false}
            size="small"
            bordered
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </div>
      )}

      {/* 改进建议 */}
      {analysis.improvement_suggestions && analysis.improvement_suggestions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 4, height: 20, background: 'linear-gradient(to bottom, #11998e, #38ef7d)', borderRadius: 2, marginRight: 8 }}></div>
            <Typography.Text strong style={{ fontSize: 16 }}>代码改进建议</Typography.Text>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: '16px 24px', borderRadius: 12 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {analysis.improvement_suggestions.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 8, lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 成本信息 */}
      {cost && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>本次分析消耗</Text>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Token" value={cost.total_tokens} valueStyle={{ fontSize: 18 }} />
            </Col>
            <Col span={6}>
              <Statistic title="输入" value={cost.input_cost} precision={4} prefix="¥" valueStyle={{ fontSize: 18 }} />
            </Col>
            <Col span={6}>
              <Statistic title="输出" value={cost.output_cost} precision={4} prefix="¥" valueStyle={{ fontSize: 18 }} />
            </Col>
            <Col span={6}>
              <Statistic title="总计" value={cost.total_cost} precision={4} prefix="¥" valueStyle={{ color: '#667eea', fontWeight: 700, fontSize: 20 }} />
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

export default AISuggestions;
