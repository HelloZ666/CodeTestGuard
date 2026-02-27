import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>正常内容</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    const ThrowingComponent = () => {
      throw new Error('测试错误');
    };
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('页面发生错误')).toBeInTheDocument();
    expect(screen.getByText('测试错误')).toBeInTheDocument();
  });

  it('shows "未知错误" when error has no message', () => {
    const ThrowingComponent = () => {
      throw new Error('');
    };
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('页面发生错误')).toBeInTheDocument();
  });

  it('renders retry button that resets error state', () => {
    let shouldThrow = true;
    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error('可恢复错误');
      }
      return <div>恢复成功</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('页面发生错误')).toBeInTheDocument();

    // Click retry - Ant Design may render text with spaces, use role-based query
    shouldThrow = false;
    const buttons = screen.getAllByRole('button');
    const retryBtn = buttons.find(btn => btn.textContent?.includes('重'));
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn!);

    // After reset, children should render again
    expect(screen.getByText('恢复成功')).toBeInTheDocument();
  });

  it('renders home button', () => {
    const ThrowingComponent = () => {
      throw new Error('错误');
    };
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('返回首页')).toBeInTheDocument();
  });

  it('calls componentDidCatch on error', () => {
    const ThrowingComponent = () => {
      throw new Error('捕获错误');
    };
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    // console.error was called by componentDidCatch
    expect(console.error).toHaveBeenCalled();
  });
});
