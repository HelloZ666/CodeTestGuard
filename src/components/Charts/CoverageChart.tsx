import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Empty } from 'antd';

interface CoverageChartProps {
  covered: number;
  uncovered: number;
  title?: string;
}

const CoverageChart: React.FC<CoverageChartProps> = ({
  covered,
  uncovered,
  title = '覆盖率分布',
}) => {
  const total = covered + uncovered;

  if (total === 0) {
    return (
      <Card title={title} style={{ marginBottom: 16 }}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      data: ['已覆盖', '未覆盖'],
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
        },
        data: [
          { value: covered, name: '已覆盖', itemStyle: { color: '#52c41a' } },
          { value: uncovered, name: '未覆盖', itemStyle: { color: '#ff4d4f' } },
        ],
      },
    ],
  };

  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <ReactECharts option={option} style={{ height: 300 }} />
    </Card>
  );
};

export default CoverageChart;
