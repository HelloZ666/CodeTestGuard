import React, { useState } from 'react';
import {
  Typography,
  Card,
  Descriptions,
  Button,
  Upload,
  Space,
  Tag,
  Switch,
  Row,
  Col,
  Spin,
  Empty,
  Statistic,
  Alert,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProject,
  uploadProjectMapping,
  analyzeWithProject,
  listRecords,
} from '../utils/api';
import FileUploadComponent from '../components/FileUpload/FileUpload';
import AnalysisResult from '../components/AnalysisResult/AnalysisResult';
import ScoreCard from '../components/ScoreCard/ScoreCard';
import AISuggestions from '../components/AISuggestions/AISuggestions';
import ScoreTrendChart from '../components/Charts/ScoreTrendChart';
import CoverageChart from '../components/Charts/CoverageChart';
import type { AnalyzeData } from '../types';

const { Title, Text } = Typography;

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [useAI, setUseAI] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeData | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !isNaN(projectId),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['records', projectId],
    queryFn: () => listRecords({ project_id: projectId, limit: 20 }),
    enabled: !isNaN(projectId),
  });

  const mappingMutation = useMutation({
    mutationFn: (file: File) => uploadProjectMapping(projectId, file),
    onSuccess: () => {
      message.success('映射文件上传成功');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: () => message.error('上传映射文件失败'),
  });

  const analyzeMutation = useMutation({
    mutationFn: (files: { codeChanges: File; testCases: File }) =>
      analyzeWithProject(projectId, files.codeChanges, files.testCases, undefined, useAI),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAnalysisResult(response.data);
        message.success(`分析完成，耗时 ${response.data.duration_ms}ms`);
        queryClient.invalidateQueries({ queryKey: ['records', projectId] });
      } else {
        message.error(response.error || '分析失败');
      }
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      const msg = err.response?.data?.detail || err.message || '请求失败';
      message.error(msg);
    },
  });

  if (projectLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!project) {
    return (
      <Card>
        <Empty description="项目不存在">
          <Button onClick={() => navigate('/projects')}>返回项目列表</Button>
        </Empty>
      </Card>
    );
  }

  const hasMappingData = !!project.mapping_data;
  const latestCoverage = analysisResult?.coverage;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/projects')} 
          style={{ marginBottom: 16, border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
        >
          返回项目列表
        </Button>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(255,255,255,0.4)',
          padding: '24px',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>{project.name}</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>{project.description || '暂无描述'}</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Statistic 
              title="综合评分" 
              value={project.stats?.avg_score ?? 0} 
              precision={1} 
              valueStyle={{ color: '#667eea', fontSize: 36, fontWeight: 700 }}
            />
          </div>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          {/* 历史图表 */}
          {records.length > 0 ? (
            <Card title="📈 评分趋势" style={{ marginBottom: 24 }}>
              <ScoreTrendChart records={records} title="" />
            </Card>
          ) : (
            <Card style={{ marginBottom: 24, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description="暂无历史数据" />
            </Card>
          )}
          
          {/* 上传分析区域 */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlayCircleOutlined style={{ color: '#667eea', fontSize: 20 }} />
                <span style={{ fontSize: 18 }}>新建分析任务</span>
              </div>
            }
            extra={
              <Space size="middle">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>AI 增强分析</Text>
                  <Switch checked={useAI} onChange={setUseAI} />
                </div>
              </Space>
            }
            style={{ marginBottom: 24, border: '1px solid rgba(102, 126, 234, 0.3)' }}
          >
            {hasMappingData ? (
              <Alert 
                message="已绑定映射文件" 
                description="项目已配置代码与用例映射，您可以直接上传变更文件进行分析。" 
                type="success" 
                showIcon 
                style={{ marginBottom: 24 }}
              />
            ) : (
              <Alert 
                message="未绑定映射文件" 
                description="请先上传映射文件，或在下方同时上传所有必需文件。" 
                type="warning" 
                showIcon 
                style={{ marginBottom: 24 }}
              />
            )}
            <FileUploadComponent
              onFilesReady={(files) => analyzeMutation.mutate(files)}
              loading={analyzeMutation.isPending}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="ℹ️ 项目信息" style={{ marginBottom: 24 }}>
            <Descriptions column={1} layout="vertical">
              <Descriptions.Item label="创建时间">
                {new Date(project.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="总分析次数">
                <span style={{ fontSize: 24, fontWeight: 600 }}>{project.stats?.analysis_count ?? 0}</span> 次
              </Descriptions.Item>
              <Descriptions.Item label="映射文件状态">
                {hasMappingData ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Tag color="success" style={{ padding: '4px 12px', fontSize: 14 }}>已绑定</Tag>
                    <Upload
                      accept=".csv"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => { mappingMutation.mutate(file); return false; }}
                    >
                      <Button type="link" size="small" icon={<UploadOutlined />}>更新</Button>
                    </Upload>
                  </div>
                ) : (
                  <div style={{ background: '#fffbe6', padding: 16, borderRadius: 8, border: '1px dashed #ffe58f', textAlign: 'center' }}>
                    <div style={{ marginBottom: 8, color: '#faad14' }}>暂无映射文件</div>
                    <Upload
                      accept=".csv"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => { mappingMutation.mutate(file); return false; }}
                    >
                      <Button type="primary" ghost size="small" icon={<UploadOutlined />} loading={mappingMutation.isPending}>
                        立即上传
                      </Button>
                    </Upload>
                  </div>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {latestCoverage && (
            <Card title="覆盖率概览">
              <CoverageChart
                covered={latestCoverage.covered.length}
                uncovered={latestCoverage.uncovered.length}
                title=""
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* 分析结果 */}
      {analysisResult && (
        <div style={{ marginTop: 32, animation: 'fadeIn 0.5s ease-in-out' }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Title level={3}>本次分析报告</Title>
          </div>
          <Row gutter={[24, 24]}>
            <Col span={16}>
              <AnalysisResult diffAnalysis={analysisResult.diff_analysis} coverage={analysisResult.coverage} />
            </Col>
            <Col span={8}>
              <ScoreCard score={analysisResult.score} />
            </Col>
            <Col span={24}>
              <AISuggestions analysis={analysisResult.ai_analysis} cost={analysisResult.ai_cost} />
            </Col>
          </Row>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetailPage;
