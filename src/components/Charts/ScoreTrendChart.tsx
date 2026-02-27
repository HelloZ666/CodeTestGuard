import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Empty } from 'antd';
import type { AnalysisRecordSummary } from '../../types';

interface ScoreTrendChartProps {
  records: AnalysisRecordSummary[];
  title?: string;
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({
  records,
  title = '评分趋势',
}) => {
  if (!records || records.length === 0) {
    return (
      <Card title={title} style={{ marginBottom: 16 }}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  // Sort by date ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const dates = sorted.map((r) =>
    new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  );
  const scores = sorted.map((r) => r.test_score);
  const tokens = sorted.map((r) => r.token_usage);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'cross' as const },
    },
    legend: {
      data: ['评分', 'Token消耗'],
    },
    xAxis: {
      type: 'category' as const,
      data: dates,
      axisLabel: { rotate: 30 },
    },
    yAxis: [
      {
        type: 'value' as const,
        name: '评分',
        min: 0,
        max: 100,
        axisLine: { show: true, lineStyle: { color: '#1890ff' } },
      },
      {
        type: 'value' as const,
        name: 'Token',
        axisLine: { show: true, lineStyle: { color: '#faad14' } },
      },
    ],
    series: [
      {
        name: '评分',
        type: 'line',
        data: scores,
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.1 },
        markLine: {
          data: [{ type: 'average', name: '平均' }],
        },
      },
      {
        name: 'Token消耗',
        type: 'bar',
        yAxisIndex: 1,
        data: tokens,
        itemStyle: { color: '#faad14', opacity: 0.6 },
      },
    ],
    grid: { left: 60, right: 60, bottom: 60 },
  };

  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <ReactECharts option={option} style={{ height: 350 }} />
    </Card>
  );
};

export default ScoreTrendChart;
