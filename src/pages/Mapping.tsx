import React, { useState } from 'react';
import {
  Typography,
  Upload,
  Button,
  Card,
  Table,
  Space,
  Tag,
  message,
  Popconfirm,
  Alert,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMappings, uploadMapping, deleteMapping, getLatestMapping } from '../utils/api';

const { Title, Text } = Typography;

interface MappingRecord {
  id: number;
  name: string;
  row_count: number;
  created_at: string;
}

interface MappingDetail extends MappingRecord {
  mapping_data: Array<{
    package_name: string;
    class_name: string;
    method_name: string;
    description: string;
  }>;
}

const MappingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: mappingsResp, isLoading } = useQuery({
    queryKey: ['mappings'],
    queryFn: listMappings,
  });

  const { data: latestResp } = useQuery({
    queryKey: ['mapping-latest'],
    queryFn: getLatestMapping,
  });

  const mappings: MappingRecord[] = mappingsResp?.data ?? [];
  const latestMapping = (latestResp?.data ?? null) as MappingDetail | null;

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadMapping(file),
    onSuccess: () => {
      message.success('映射文件上传成功');
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
      queryClient.invalidateQueries({ queryKey: ['mapping-latest'] });
      setUploading(false);
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      message.error(err.response?.data?.detail || '上传失败');
      setUploading(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMapping(id),
    onSuccess: () => {
      message.success('映射已删除');
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
      queryClient.invalidateQueries({ queryKey: ['mapping-latest'] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '映射条目数',
      dataIndex: 'row_count',
      key: 'row_count',
      width: 120,
      render: (count: number) => <Tag color="blue">{count} 条</Tag>,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: unknown, record: MappingRecord) =>
        latestMapping && record.id === latestMapping.id ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            当前使用
          </Tag>
        ) : null,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: MappingRecord) => (
        <Popconfirm
          title="确定删除此映射？"
          onConfirm={() => deleteMut.mutate(record.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>映射关系管理</Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        description="映射关系文件定义了代码方法与功能的对应关系。上传后，分析时会自动使用最新的映射文件，无需每次重复上传。"
      />

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>上传映射文件</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Space>
          <Upload
            accept=".csv"
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              setUploading(true);
              uploadMut.mutate(file);
              return false;
            }}
          >
            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
              选择CSV文件上传
            </Button>
          </Upload>
          <Text type="secondary">CSV格式，包含：包名、类名、方法名、功能描述</Text>
        </Space>
      </Card>

      {latestMapping && (
        <Card title="当前使用的映射详情" style={{ marginBottom: 24 }} size="small">
          <Table
            dataSource={latestMapping.mapping_data}
            rowKey={(_, idx) => String(idx)}
            size="small"
            pagination={false}
            columns={[
              { title: '包名', dataIndex: 'package_name', key: 'package_name' },
              { title: '类名', dataIndex: 'class_name', key: 'class_name' },
              { title: '方法名', dataIndex: 'method_name', key: 'method_name' },
              { title: '功能描述', dataIndex: 'description', key: 'description' },
            ]}
          />
        </Card>
      )}

      <Card title="历史映射文件">
        <Table
          dataSource={mappings}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无映射文件，请先上传' }}
        />
      </Card>
    </div>
  );
};

export default MappingPage;
