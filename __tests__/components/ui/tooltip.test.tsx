/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Mock @radix-ui/react-tooltip
jest.mock('@radix-ui/react-tooltip', () => {
  const TooltipProviderMock = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  );
  TooltipProviderMock.displayName = 'TooltipProvider';

  const TooltipRootMock = ({ children, open: controlledOpen, onOpenChange }: { 
    children: React.ReactNode; 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void;
  }) => {
    const [internalOpen, setInternalOpen] = React.useState(controlledOpen ?? false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpenState: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpenState);
      } else {
        setInternalOpen(newOpenState);
      }
    };

    return (
      <div 
        data-testid="tooltip-root" 
        data-open={String(isOpen)}
        onClick={() => handleOpenChange(!isOpen)}
      >
        {children}
      </div>
    );
  };
  TooltipRootMock.displayName = 'TooltipRoot';

  const TooltipTriggerMock = ({ children }: { children: React.ReactNode }) => (
    <button data-testid="tooltip-trigger">{children}</button>
  );
  TooltipTriggerMock.displayName = 'TooltipTrigger';

  const TooltipContentMock = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { 
      sideOffset?: number;
      className?: string;
    }
  >(({ children, sideOffset, className, ...props }, ref) => (
  <div
    ref={ref}
    data-testid="tooltip-content"
    data-side-offset={sideOffset}
    className={className}
    {...props}
  >
    {children}
  </div>
));
  TooltipContentMock.displayName = 'TooltipContent';

  return {
    Provider: TooltipProviderMock,
    Root: TooltipRootMock,
    Trigger: TooltipTriggerMock,
    Content: TooltipContentMock,
  };
});

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Tooltip Component', () => {
  it('renders tooltip provider', () => {
    render(
      <TooltipProvider>
        <div>Test Content</div>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders tooltip with trigger and content', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-root')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
  });

  it('handles open state changes', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const root = screen.getByTestId('tooltip-root');
    expect(root).toHaveAttribute('data-open', 'false');

    fireEvent.click(root);
    expect(root).toHaveAttribute('data-open', 'true');

    fireEvent.click(root);
    expect(root).toHaveAttribute('data-open', 'false');
  });

  it('applies custom side offset', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={8}>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-content')).toHaveAttribute('data-side-offset', '8');
  });

  it('applies custom className', () => {
    const customClass = 'custom-tooltip';
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className={customClass}>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-content')).toHaveClass(customClass);
  });

  it('applies default styles', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId('tooltip-content');
    expect(content).toHaveClass('z-50');
    expect(content).toHaveClass('overflow-hidden');
    expect(content).toHaveClass('rounded-md');
    expect(content).toHaveClass('border');
    expect(content).toHaveClass('bg-popover');
    expect(content).toHaveClass('px-3');
    expect(content).toHaveClass('py-1.5');
    expect(content).toHaveClass('text-sm');
    expect(content).toHaveClass('text-popover-foreground');
    expect(content).toHaveClass('shadow-md');
  });

  it('handles controlled open state', () => {
    const onOpenChange = jest.fn();
    render(
      <TooltipProvider>
        <Tooltip open={true} onOpenChange={onOpenChange}>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const root = screen.getByTestId('tooltip-root');
    expect(root).toHaveAttribute('data-open', 'true');

    fireEvent.click(root);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
}); 