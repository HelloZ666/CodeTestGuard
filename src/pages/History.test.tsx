import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from './History';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Mock child components that receive complex data
vi.mock('../components/ScoreCard/ScoreCard', () => ({
  default: () => <div data-testid="score-card">ScoreCard</div>,
}));

vi.mock('../components/AISuggestions/AISuggestions', () => ({
  default: () => <div data-testid="ai-suggestions">AISuggestions</div>,
}));

// Mock the API module
vi.mock('../utils/api', () => ({
  listProjects: vi.fn(),
  listRecords: vi.fn(),
  getRecord: vi.fn(),
}));

import { listProjects, listRecords, getRecord } from '../utils/api';
import { saveAs } from 'file-saver';

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

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    expect(screen.getByText('历史记录')).toBeInTheDocument();
  });

  it('renders project filter', () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    expect(screen.getByText('筛选项目：')).toBeInTheDocument();
  });

  it('shows empty state when no records', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('暂无分析记录')).toBeInTheDocument();
  });

  it('renders records table when data available', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: '测试项目', description: '', mapping_data: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    ]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        project_id: 1,
        test_score: 85.5,
        token_usage: 1500,
        cost: 0.006,
        duration_ms: 3200,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('85.5')).toBeInTheDocument();
  });

  it('renders detail button for each record', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        project_id: 1,
        test_score: 70,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('详情')).toBeInTheDocument();
  });

  it('displays grade tags based on score', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        project_id: 1,
        test_score: 95,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('A')).toBeInTheDocument();
  });

  it('displays grade B for score 85', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 2,
        project_id: 1,
        test_score: 85,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('B')).toBeInTheDocument();
  });

  it('displays grade C for score 65', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 3,
        project_id: 1,
        test_score: 65,
        token_usage: 500,
        cost: 0.002,
        duration_ms: 1500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('C')).toBeInTheDocument();
  });

  it('displays grade D for score 45', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 4,
        project_id: 1,
        test_score: 45,
        token_usage: 500,
        cost: 0.002,
        duration_ms: 1500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('D')).toBeInTheDocument();
  });

  it('displays grade F for score 30', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 5,
        project_id: 1,
        test_score: 30,
        token_usage: 500,
        cost: 0.002,
        duration_ms: 1500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('F')).toBeInTheDocument();
  });

  it('opens drawer when clicking detail button', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 10,
        project_id: 1,
        test_score: 80,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    (getRecord as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      project_id: 1,
      code_changes_summary: {},
      test_coverage_result: {},
      test_score: 80,
      ai_suggestions: null,
      token_usage: 1000,
      cost: 0.004,
      duration_ms: 2500,
      created_at: '2025-01-15T10:30:00Z',
    });
    renderWithProviders(<HistoryPage />);
    const detailBtn = await screen.findByText('详情');
    fireEvent.click(detailBtn);
    expect(await screen.findByText(/分析记录详情 #10/)).toBeInTheDocument();
  });

  it('shows record detail info in drawer', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 10,
        project_id: 1,
        test_score: 80,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    (getRecord as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      project_id: 1,
      code_changes_summary: {},
      test_coverage_result: null,
      test_score: 80,
      ai_suggestions: null,
      token_usage: 1000,
      cost: 0.004,
      duration_ms: 2500,
      created_at: '2025-01-15T10:30:00Z',
    });
    renderWithProviders(<HistoryPage />);
    const detailBtn = await screen.findByText('详情');
    fireEvent.click(detailBtn);
    // Wait for record detail to load
    expect(await screen.findByText('80.0')).toBeInTheDocument();
    expect(screen.getByText('2500ms')).toBeInTheDocument();
  });

  it('shows export JSON button in drawer', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 10,
        project_id: 1,
        test_score: 80,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    (getRecord as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      project_id: 1,
      code_changes_summary: {},
      test_coverage_result: null,
      test_score: 80,
      ai_suggestions: null,
      token_usage: 1000,
      cost: 0.004,
      duration_ms: 2500,
      created_at: '2025-01-15T10:30:00Z',
    });
    renderWithProviders(<HistoryPage />);
    const detailBtn = await screen.findByText('详情');
    fireEvent.click(detailBtn);
    const jsonBtn = await screen.findByText('JSON');
    expect(jsonBtn).toBeInTheDocument();
    fireEvent.click(jsonBtn);
    await waitFor(() => {
      expect(saveAs).toHaveBeenCalled();
    });
  });

  it('shows export CSV button in drawer and exports', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 10,
        project_id: 1,
        test_score: 80,
        token_usage: 1000,
        cost: 0.004,
        duration_ms: 2500,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    (getRecord as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      project_id: 1,
      code_changes_summary: {},
      test_coverage_result: {
        details: [
          { method: 'testMethod', description: '测试', is_covered: true, matched_tests: ['TC001'] },
        ],
      },
      test_score: 80,
      ai_suggestions: null,
      token_usage: 1000,
      cost: 0.004,
      duration_ms: 2500,
      created_at: '2025-01-15T10:30:00Z',
    });
    renderWithProviders(<HistoryPage />);
    const detailBtn = await screen.findByText('详情');
    fireEvent.click(detailBtn);
    const csvBtn = await screen.findByText('CSV');
    expect(csvBtn).toBeInTheDocument();
    fireEvent.click(csvBtn);
    await waitFor(() => {
      expect(saveAs).toHaveBeenCalled();
    });
  });

  it('shows token usage with dash when zero', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 6,
        project_id: 1,
        test_score: 70,
        token_usage: 0,
        cost: 0,
        duration_ms: 1000,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    await screen.findByText('70.0');
    // token_usage=0 and cost=0 should render '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows project name in project column', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: '我的项目', description: '', mapping_data: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    ]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        project_id: 1,
        test_score: 90,
        token_usage: 500,
        cost: 0.002,
        duration_ms: 1000,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('我的项目')).toBeInTheDocument();
  });

  it('shows project id fallback when project not found', async () => {
    (listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        project_id: 999,
        test_score: 90,
        token_usage: 500,
        cost: 0.002,
        duration_ms: 1000,
        created_at: '2025-01-15T10:30:00Z',
      },
    ]);
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText('#999')).toBeInTheDocument();
  });
});
