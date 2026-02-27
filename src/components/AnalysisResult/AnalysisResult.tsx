import React from 'react';
import { Card, Table, Tag, Statistic, Row, Col, Progress } from 'antd';
import type { DiffAnalysis, CoverageResult } from '../../types';

interface AnalysisResultProps {
  diffAnalysis: DiffAnalysis;
  coverage: CoverageResult;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ diffAnalysis, coverage }) => {
  const coveragePercent = Math.round(coverage.coverage_rate * 100);

  const diffColumns = [
    { title: '包路径', dataIndex: 'package', key: 'package', ellipsis: true },
    {
      title: '新增行',
      dataIndex: 'added',
      key: 'added',
      width: 100,
      render: (v: number) => <span style={{ color: '#52c41a' }}>+{v}</span>,
    },
    {
      title: '删除行',
      dataIndex: 'removed',
      key: 'removed',
      width: 100,
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>-{v}</span>,
    },
  ];

  const coverageColumns = [
    { title: '方法', dataIndex: 'method', key: 'method', ellipsis: true },
    { title: '功能描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '覆盖状态',
      dataIndex: 'is_covered',
      key: 'is_covered',
      width: 100,
      render: (v: boolean) =>
        v ? <Tag color="green">已覆盖</Tag> : <Tag color="red">未覆盖</Tag>,
    },
    {
      title: '匹配用例',
      dataIndex: 'matched_tests',
      key: 'matched_tests',
      width: 150,
      render: (tests: string[]) =>
        tests.length > 0 ? tests.map((t) => <Tag key={t}>{t}</Tag>) : <span style={{ color: '#999' }}>—</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card title="📊 代码改动分析" bordered={false}>
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <Statistic title="变更文件数" value={diffAnalysis.total_files} valueStyle={{ fontSize: 32 }} />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(82, 196, 26, 0.1)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <Statistic 
                title="新增行" 
                value={diffAnalysis.total_added} 
                valueStyle={{ color: '#52c41a', fontSize: 32 }} 
                prefix="+"
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255, 77, 79, 0.1)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <Statistic 
                title="删除行" 
                value={diffAnalysis.total_removed} 
                valueStyle={{ color: '#ff4d4f', fontSize: 32 }} 
                prefix="-"
              />
            </div>
          </Col>
        </Row>
        <Table
          dataSource={diffAnalysis.files}
          columns={diffColumns}
          rowKey="package"
          pagination={false}
          size="middle"
          scroll={{ y: 300 }}
        />
      </Card>

      <Card title="🎯 测试覆盖分析" bordered={false}>
        <Row gutter={24} style={{ marginBottom: 24 }} align="middle">
          <Col span={16}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="改动方法数" value={coverage.total_changed_methods} />
              </Col>
              <Col span={8}>
                <Statistic title="已覆盖" value={coverage.covered.length} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={8}>
                <Statistic title="未覆盖" value={coverage.uncovered.length} valueStyle={{ color: '#ff4d4f' }} />
              </Col>
            </Row>
          </Col>
          <Col span={8} style={{ display: 'flex', justifyContent: 'center' }}>
             <Progress
                type="circle"
                percent={coveragePercent}
                size={100}
                strokeColor={{
                  '0%': '#11998e',
                  '100%': '#38ef7d',
                }}
                strokeWidth={10}
                format={(percent) => (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{percent}%</span>
                    <span style={{ fontSize: 12, color: '#999' }}>覆盖率</span>
                  </div>
                )}
              />
          </Col>
        </Row>
        <Table
          dataSource={coverage.details}
          columns={coverageColumns}
          rowKey="method"
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default AnalysisResult;
