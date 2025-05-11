import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DailyLimitInfo } from '@/components/ui/DailyLimitInfo';
import { useDailyLimit } from '@/hooks/useDailyLimit';

// Mock the useDailyLimit hook
jest.mock('@/hooks/useDailyLimit', () => ({
  useDailyLimit: jest.fn(),
}));

// Mock Tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
}));

describe('DailyLimitInfo Component', () => {
  beforeEach(() => {
    // Default mock implementation
    (useDailyLimit as jest.Mock).mockReturnValue({
      used: 3,
      limit: 5,
      remaining: 2,
      resetTimestamp: Math.floor(Date.now() / 1000) + 3600,
      loading: false,
      error: null,
      formattedTimeUntilReset: '1h 0m until reset',
      refreshUsage: jest.fn(),
    });
  });

  it('should display loading state', () => {
    (useDailyLimit as jest.Mock).mockReturnValue({
      loading: true,
      refreshUsage: jest.fn(),
    });

    render(<DailyLimitInfo />);
    expect(screen.getByText('Loading usage data...')).toBeInTheDocument();
  });

  it.skip('should hide the component when user has own API key in compact mode', () => {
    const { container } = render(<DailyLimitInfo hasOwnApiKey={true} variant="compact" />);
    expect(container.firstChild).toBeNull();
  });

  it('should show unlimited message when user has own API key in detailed mode', () => {
    render(<DailyLimitInfo hasOwnApiKey={true} variant="detailed" />);
    expect(screen.getByText('Using your own API key - no generation limits apply')).toBeInTheDocument();
  });

  it('should show compact view with remaining generations', () => {
    render(<DailyLimitInfo />);
    
    // Check if we have the compact view
    expect(screen.getByText('2 free generations left')).toBeInTheDocument();
  });

  it('should show detailed view with progress bar', () => {
    render(<DailyLimitInfo variant="detailed" />);
    
    // Check for detailed view components
    expect(screen.getByText('Daily Free Generations')).toBeInTheDocument();
    expect(screen.getByText('2 of 5 remaining')).toBeInTheDocument();
    expect(screen.getByText('Resets in 1h 0m until reset')).toBeInTheDocument();
  });

  it('should show red warning when no generations remain', () => {
    // Override mock to return 0 remaining
    (useDailyLimit as jest.Mock).mockReturnValue({
      used: 5,
      limit: 5,
      remaining: 0,
      resetTimestamp: Math.floor(Date.now() / 1000) + 3600,
      loading: false,
      error: null,
      formattedTimeUntilReset: '1h 0m until reset',
      refreshUsage: jest.fn(),
    });

    render(<DailyLimitInfo variant="detailed" />);
    
    // Check for zero remaining text with special messaging
    expect(screen.getByText('0 of 5 remaining')).toBeInTheDocument();
    expect(screen.getByText('Limit reached. Resets in 1h 0m until reset')).toBeInTheDocument();
  });

  it('should use singular form when only 1 generation remains', () => {
    // Override mock to return 1 remaining
    (useDailyLimit as jest.Mock).mockReturnValue({
      used: 4,
      limit: 5,
      remaining: 1,
      resetTimestamp: Math.floor(Date.now() / 1000) + 3600,
      loading: false,
      error: null,
      formattedTimeUntilReset: '1h 0m until reset',
      refreshUsage: jest.fn(),
    });

    render(<DailyLimitInfo />);
    
    // Check for singular form
    expect(screen.getByText('1 free generation left')).toBeInTheDocument();
  });
}); 