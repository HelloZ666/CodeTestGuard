import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProjectDetailPage from './ProjectDetail';

// Mock react-router-dom (keep MemoryRouter, override useParams/useNavigate)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock API module
vi.mock('../utils/api', () => ({
  getProject: vi.fn(),
  uploadProjectMapping: vi.fn(),
  analyzeWithProject: vi.fn(),
  listRecords: vi.fn(),
}));

// Mock child components to keep tests focused
vi.mock('../components/FileUpload/FileUpload', () => ({
  default: ({ onFilesReady, loading }: { onFilesReady: (files: { codeChanges: File; testCases: File; mappingFile: File }) => void; loading?: boolean }) => (
    <div data-testid="file-upload">
      <button
        data-testid="mock-submit"
        onClick={() =>
          onFilesReady({
            codeChanges: new File(['c'], 'code.json'),
            testCases: new File(['t'], 'tests.csv'),
            mappingFile: new File(['m'], 'mapping.csv'),
          })
        }
      >
        {loading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  ),
}));

vi.mock('../components/AnalysisResult/AnalysisResult', () => ({
  default: () => <div data-testid="analysis-result">AnalysisResult</div>,
}));

vi.mock('../components/ScoreCard/ScoreCard', () => ({
  default: () => <div data-testid="score-card">ScoreCard</div>,
}));

vi.mock('../components/AISuggestions/AISuggestions', () => ({
  default: () => <div data-testid="ai-suggestions">AISuggestions</div>,
}));

vi.mock('../components/Charts/ScoreTrendChart', () => ({
  default: () => <div data-testid="score-trend-chart">ScoreTrendChart</div>,
}));

vi.mock('../components/Charts/CoverageChart', () => ({
  default: () => <div data-testid="coverage-chart">CoverageChart</div>,
}));

import { getProject, analyzeWithProject, listRecords } from '../utils/api';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockProject = {
  id: 1,
  name: '测试项目',
  description: '项目描述',
  mapping_data: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  stats: {
    analysis_count: 5,
    avg_score: 82.5,
    latest_analysis: '2025-01-15T10:00:00Z',
  },
};

const mockProjectWithMapping = {
  ...mockProject,
  mapping_data: { some: 'data' },
};

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching project', () => {
    (getProject as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    // Spin renders with role="img" or we can check for the spinner
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('shows empty state when project not found', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('项目不存在')).toBeInTheDocument();
  });

  it('navigates back when clicking back button on empty state', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    const backBtn = await screen.findByText('返回项目列表');
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('renders project name and info when loaded', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('测试项目')).toBeInTheDocument();
  });

  it('renders project description', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    // Ant Design Descriptions renders label and content with same text
    const elements = await screen.findAllByText('项目描述');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "无描述" when project has no description', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockProject, description: '' });
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('无描述')).toBeInTheDocument();
  });

  it('shows upload mapping button when no mapping data', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    const uploadBtns = await screen.findAllByText('上传映射文件');
    expect(uploadBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "已绑定" tag when mapping data exists', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectWithMapping);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('已绑定')).toBeInTheDocument();
  });

  it('displays analysis count from stats', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText(/5 次/)).toBeInTheDocument();
  });

  it('displays average score from stats', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('82.5')).toBeInTheDocument();
  });

  it('shows "—" when avg_score is null', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockProject,
      stats: { ...mockProject.stats, avg_score: null },
    });
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('—')).toBeInTheDocument();
  });

  it('renders back button that navigates to projects', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    const backBtn = await screen.findByText('返回');
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('renders FileUpload component', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByTestId('file-upload')).toBeInTheDocument();
  });

  it('shows warning text when no mapping data bound', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText(/请先上传映射文件/)).toBeInTheDocument();
  });

  it('shows info text when mapping data is bound', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectWithMapping);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText(/已使用项目绑定的映射文件/)).toBeInTheDocument();
  });

  it('renders score trend chart when records exist', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, project_id: 1, test_score: 80, token_usage: 100, cost: 0.01, duration_ms: 500, created_at: '2025-01-01T00:00:00Z' },
    ]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByTestId('score-trend-chart')).toBeInTheDocument();
  });

  it('triggers analysis mutation when files submitted', async () => {
    const mockResponse = {
      success: true,
      data: {
        diff_analysis: { total_files: 1, total_added: 10, total_removed: 5, files: [] },
        coverage: { total_changed_methods: 3, covered: ['a'], uncovered: ['b'], coverage_rate: 0.5, details: [] },
        score: { total_score: 80, grade: 'B', summary: 'Good', dimensions: [] },
        ai_analysis: null,
        ai_cost: null,
        duration_ms: 1500,
      },
    };
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectWithMapping);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (analyzeWithProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    renderWithProviders(<ProjectDetailPage />);

    const submitBtn = await screen.findByTestId('mock-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(analyzeWithProject).toHaveBeenCalled();
    });
  });

  it('shows analysis results after successful mutation', async () => {
    const mockResponse = {
      success: true,
      data: {
        diff_analysis: { total_files: 1, total_added: 10, total_removed: 5, files: [] },
        coverage: { total_changed_methods: 3, covered: ['a'], uncovered: ['b'], coverage_rate: 0.5, details: [] },
        score: { total_score: 80, grade: 'B', summary: 'Good', dimensions: [] },
        ai_analysis: null,
        ai_cost: null,
        duration_ms: 1500,
      },
    };
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectWithMapping);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (analyzeWithProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    renderWithProviders(<ProjectDetailPage />);

    const submitBtn = await screen.findByTestId('mock-submit');
    fireEvent.click(submitBtn);

    expect(await screen.findByTestId('analysis-result')).toBeInTheDocument();
    expect(screen.getByTestId('score-card')).toBeInTheDocument();
    expect(screen.getByTestId('ai-suggestions')).toBeInTheDocument();
  });

  it('renders "新建分析" card title', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('新建分析')).toBeInTheDocument();
  });

  it('renders AI switch', async () => {
    (getProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<ProjectDetailPage />);
    expect(await screen.findByText('AI分析：')).toBeInTheDocument();
  });
});
