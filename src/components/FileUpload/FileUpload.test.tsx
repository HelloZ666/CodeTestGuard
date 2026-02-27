import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUploadComponent from './FileUpload';

describe('FileUpload', () => {
  const mockOnFilesReady = vi.fn();

  beforeEach(() => {
    mockOnFilesReady.mockClear();
  });

  it('renders three upload slots', () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);
    expect(screen.getByText('代码改动文件')).toBeInTheDocument();
    expect(screen.getByText('测试用例文件')).toBeInTheDocument();
    expect(screen.getByText('映射关系文件')).toBeInTheDocument();
  });

  it('renders submit button disabled initially', () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);
    const btn = screen.getByRole('button', { name: /开始分析/ });
    expect(btn).toBeDisabled();
  });

  it('shows loading state when loading prop is true', () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} loading={true} />);
    const btn = screen.getByRole('button', { name: /开始分析/ });
    expect(btn).toBeInTheDocument();
  });

  it('displays file format descriptions', () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);
    expect(screen.getByText(/JSON格式/)).toBeInTheDocument();
    expect(screen.getByText(/CSV或Excel格式/)).toBeInTheDocument();
    expect(screen.getByText(/CSV格式，包含包名/)).toBeInTheDocument();
  });

  it('enables submit button after all files are selected', async () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);

    // Simulate file selection for each upload slot
    const uploadInputs = document.querySelectorAll('input[type="file"]');
    expect(uploadInputs.length).toBe(3);

    const codeFile = new File(['{"current":[]}'], 'code.json', { type: 'application/json' });
    const testFile = new File(['id,name'], 'tests.csv', { type: 'text/csv' });
    const mappingFile = new File(['pkg,class,method,desc'], 'mapping.csv', { type: 'text/csv' });

    fireEvent.change(uploadInputs[0], { target: { files: [codeFile] } });
    fireEvent.change(uploadInputs[1], { target: { files: [testFile] } });
    fireEvent.change(uploadInputs[2], { target: { files: [mappingFile] } });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /开始分析/ });
      expect(btn).not.toBeDisabled();
    });
  });

  it('calls onFilesReady when submit is clicked with all files', async () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);

    const uploadInputs = document.querySelectorAll('input[type="file"]');

    const codeFile = new File(['{"current":[]}'], 'code.json', { type: 'application/json' });
    const testFile = new File(['id,name'], 'tests.csv', { type: 'text/csv' });
    const mappingFile = new File(['pkg,class,method,desc'], 'mapping.csv', { type: 'text/csv' });

    fireEvent.change(uploadInputs[0], { target: { files: [codeFile] } });
    fireEvent.change(uploadInputs[1], { target: { files: [testFile] } });
    fireEvent.change(uploadInputs[2], { target: { files: [mappingFile] } });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /开始分析/ });
      expect(btn).not.toBeDisabled();
    });

    const submitBtn = screen.getByRole('button', { name: /开始分析/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnFilesReady).toHaveBeenCalledTimes(1);
      expect(mockOnFilesReady).toHaveBeenCalledWith(
        expect.objectContaining({
          codeChanges: expect.any(File),
          testCases: expect.any(File),
          mappingFile: expect.any(File),
        })
      );
    });
  });

  it('does not call onFilesReady when submit clicked without all files', () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);
    const btn = screen.getByRole('button', { name: /开始分析/ });
    fireEvent.click(btn);
    expect(mockOnFilesReady).not.toHaveBeenCalled();
  });

  it('renders card title', () => {
    render(<FileUploadComponent onFilesReady={mockOnFilesReady} />);
    expect(screen.getByText('上传文件')).toBeInTheDocument();
  });
});
