import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisResult from './AnalysisResult';
import type { DiffAnalysis, CoverageResult } from '../../types';

const mockDiff: DiffAnalysis = {
  total_files: 2,
  total_added: 15,
  total_removed: 5,
  files: [
    { package: 'com.example.user', added: 10, removed: 3 },
    { package: 'com.example.order', added: 5, removed: 2 },
  ],
};

const mockCoverage: CoverageResult = {
  total_changed_methods: 3,
  covered: ['com.example.user.UserService.createUser'],
  uncovered: ['com.example.user.UserService.deleteUser'],
  coverage_rate: 0.67,
  details: [
    {
      method: 'com.example.user.UserService.createUser',
      description: '创建用户',
      is_covered: true,
      matched_tests: ['TC001'],
    },
    {
      method: 'com.example.user.UserService.deleteUser',
      description: '删除用户',
      is_covered: false,
      matched_tests: [],
    },
  ],
};

describe('AnalysisResult', () => {
  it('renders diff statistics', () => {
    render(<AnalysisResult diffAnalysis={mockDiff} coverage={mockCoverage} />);
    expect(screen.getByText('代码改动分析')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // total_files
  });

  it('renders coverage statistics', () => {
    render(<AnalysisResult diffAnalysis={mockDiff} coverage={mockCoverage} />);
    expect(screen.getByText('测试覆盖分析')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument(); // coverage_rate
  });

  it('renders covered tag', () => {
    render(<AnalysisResult diffAnalysis={mockDiff} coverage={mockCoverage} />);
    expect(screen.getAllByText('已覆盖').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('未覆盖').length).toBeGreaterThanOrEqual(1);
  });

  it('renders package paths in diff table', () => {
    render(<AnalysisResult diffAnalysis={mockDiff} coverage={mockCoverage} />);
    expect(screen.getByText('com.example.user')).toBeInTheDocument();
    expect(screen.getByText('com.example.order')).toBeInTheDocument();
  });

  it('renders matched test IDs', () => {
    render(<AnalysisResult diffAnalysis={mockDiff} coverage={mockCoverage} />);
    expect(screen.getByText('TC001')).toBeInTheDocument();
  });
});
