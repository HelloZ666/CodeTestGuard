import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Tag, message, Row, Col } from 'antd';
import { TableOutlined, CodeOutlined, UploadOutlined, RocketOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Text } = Typography;

interface FileUploadProps {
  onFilesReady: (files: { codeChanges: File; testCases: File }) => void;
  loading?: boolean;
}

interface FileSlot {
  key: string;
  label: string;
  accept: string;
  icon: React.ReactNode;
  description: string;
}

const FILE_SLOTS: FileSlot[] = [
  {
    key: 'codeChanges',
    label: '代码改动文件',
    accept: '.json',
    icon: <CodeOutlined />,
    description: 'JSON格式，包含current和history字段',
  },
  {
    key: 'testCases',
    label: '测试用例文件',
    accept: '.csv,.xlsx,.xls',
    icon: <TableOutlined />,
    description: 'CSV或Excel格式，包含用例ID/功能/步骤/预期结果',
  },
];

const FileUploadComponent: React.FC<FileUploadProps> = ({ onFilesReady, loading }) => {
  const [files, setFiles] = useState<Record<string, File | null>>({
    codeChanges: null,
    testCases: null,
  });

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const allReady = files.codeChanges && files.testCases;

  const handleSubmit = () => {
    if (!allReady) {
      message.warning('请先上传所有必需文件');
      return;
    }
    onFilesReady({
      codeChanges: files.codeChanges!,
      testCases: files.testCases!,
    });
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📄 上传文件</span>
          <Tag color="blue">必需</Tag>
        </div>
      } 
      style={{ marginBottom: 24 }}
      bordered={false}
    >
      <Row gutter={24}>
        {FILE_SLOTS.map((slot) => (
          <Col span={12} key={slot.key}>
            <div 
              style={{ 
                background: 'rgba(255,255,255,0.5)', 
                padding: 20, 
                borderRadius: 12, 
                border: '1px dashed rgba(0,0,0,0.1)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s'
              }}
              className="upload-slot"
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  color: '#fff',
                  fontSize: 20
                }}>
                  {slot.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{slot.label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{slot.accept}</div>
                </div>
                {files[slot.key] && <Tag color="success" style={{ marginLeft: 'auto' }}>已就绪</Tag>}
              </div>
              
              <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, flex: 1 }}>
                {slot.description}
              </Text>

              <Upload
                accept={slot.accept}
                maxCount={1}
                beforeUpload={(file) => {
                  handleFileChange(slot.key, file);
                  return false;
                }}
                onRemove={() => handleFileChange(slot.key, null)}
                fileList={
                  files[slot.key]
                    ? [{ uid: slot.key, name: files[slot.key]!.name, status: 'done' } as UploadFile]
                    : []
                }
                style={{ width: '100%' }}
              >
                <Button block icon={<UploadOutlined />} size="large">
                  {files[slot.key] ? '重新选择' : '点击上传'}
                </Button>
              </Upload>
            </div>
          </Col>
        ))}
      </Row>
      
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          disabled={!allReady}
          loading={loading}
          style={{ 
            height: 50, 
            padding: '0 48px', 
            fontSize: 16, 
            borderRadius: 25,
            background: allReady ? 'var(--primary-gradient)' : undefined
          }}
          icon={<RocketOutlined />}
        >
          开始智能分析
        </Button>
      </div>
    </Card>
  );
};

export default FileUploadComponent;
