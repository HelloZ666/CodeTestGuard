import React from 'react';
import { Card, Progress, Tag, Typography } from 'antd';
import type { ScoreResult, ScoreDimension } from '../../types';

const { Text } = Typography;

interface ScoreCardProps {
  score: ScoreResult;
}

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: '#52c41a',
    B: '#1890ff',
    C: '#faad14',
    D: '#fa8c16',
    F: '#ff4d4f',
  };
  return colors[grade] || '#999';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#faad14';
  return '#ff4d4f';
}

const DimensionBar: React.FC<{ dim: ScoreDimension }> = ({ dim }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text>{dim.dimension}（权重 {Math.round(dim.weight * 100)}%）</Text>
      <Text strong>{dim.score.toFixed(1)} 分</Text>
    </div>
    <Progress
      percent={dim.score}
      showInfo={false}
      strokeColor={getScoreColor(dim.score)}
      size="small"
    />
    <Text type="secondary" style={{ fontSize: 12 }}>{dim.details}</Text>
  </div>
);

const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  const gradeColor = getGradeColor(score.grade);
  
  return (
    <Card 
      title="🏆 质量评分" 
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          width: 120, 
          height: 120, 
          borderRadius: '50%', 
          background: `conic-gradient(${gradeColor} 0%, ${gradeColor} 100%)`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: `0 10px 30px -10px ${gradeColor}`
        }}>
          <div style={{ 
            width: 108, 
            height: 108, 
            borderRadius: '50%', 
            background: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>{score.grade}</span>
            <span style={{ fontSize: 14, color: '#999', fontWeight: 500 }}>等级</span>
          </div>
        </div>
        
        <div style={{ fontSize: 36, fontWeight: 700, color: '#333' }}>
          {score.total_score.toFixed(1)} <span style={{ fontSize: 16, color: '#999', fontWeight: 400 }}>/ 100</span>
        </div>
        <Tag color={gradeColor} style={{ marginTop: 8, fontSize: 14, padding: '4px 12px' }}>
          {score.summary}
        </Tag>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {score.dimensions.map((dim) => (
          <DimensionBar key={dim.dimension} dim={dim} />
        ))}
      </div>
    </Card>
  );
};


export default ScoreCard;
