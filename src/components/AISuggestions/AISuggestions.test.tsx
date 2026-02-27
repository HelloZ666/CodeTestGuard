import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AISuggestions from './AISuggestions';
import type { AIAnalysis, AICost } from '../../types';

const mockAnalysis: AIAnalysis = {
  uncovered_methods: ['com.example.user.UserService.deleteUser'],
  coverage_gaps: 'deleteUser方法是新增方法，缺少对应的测试用例覆盖',
  suggested_test_cases: [
    {
      test_id: 'TC005',
      test_function: '删除用户-正常删除',
      test_steps: '1. 创建测试用户 2. 调用删除接口',
      expected_result: '用户状态变为deleted',
    },
  ],
  risk_assessment: 'medium',
  improvement_suggestions: ['新增deleteUser方法缺少测试覆盖'],
};

const mockCost: AICost = {
  input_cost: 0.001,
  output_cost: 0.004,
  total_cost: 0.005,
  total_tokens: 2000,
};

describe('AISuggestions', () => {
  it('renders when no analysis provided', () => {
    render(<AISuggestions analysis={null} cost={null} />);
    expect(screen.getByText('未使用AI分析')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<AISuggestions analysis={{ error: 'AI超时' }} cost={null} />);
    expect(screen.getByText('AI超时')).toBeInTheDocument();
  });

  it('renders risk assessment', () => {
    render(<AISuggestions analysis={mockAnalysis} cost={mockCost} />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('renders coverage gaps', () => {
    render(<AISuggestions analysis={mockAnalysis} cost={mockCost} />);
    expect(screen.getAllByText(/deleteUser/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders suggested test cases', () => {
    render(<AISuggestions analysis={mockAnalysis} cost={mockCost} />);
    expect(screen.getByText('TC005')).toBeInTheDocument();
    expect(screen.getByText('删除用户-正常删除')).toBeInTheDocument();
  });

  it('renders improvement suggestions', () => {
    render(<AISuggestions analysis={mockAnalysis} cost={mockCost} />);
    expect(screen.getByText(/缺少测试覆盖/)).toBeInTheDocument();
  });

  it('renders cost information', () => {
    render(<AISuggestions analysis={mockAnalysis} cost={mockCost} />);
    expect(screen.getByText('2,000')).toBeInTheDocument(); // total_tokens (formatted with comma)
  });
});
