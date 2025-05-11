/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Switch } from '@/components/ui/switch';

// Mock @radix-ui/react-switch
jest.mock('@radix-ui/react-switch', () => {
  const SwitchPrimitive = {
    Root: React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement> & {
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
        disabled?: boolean;
        className?: string;
      }
    >(({ children, checked, onCheckedChange, disabled, className, ...props }, ref) => (
      <button
        ref={ref}
        data-testid="switch-root"
        data-state={checked ? 'checked' : 'unchecked'}
        data-disabled={disabled}
        className={className}
        onClick={() => onCheckedChange?.(!checked)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )),
    Thumb: React.forwardRef<
      HTMLSpanElement,
      React.HTMLAttributes<HTMLSpanElement> & { className?: string }
    >(({ className, ...props }, ref) => (
      <span
        ref={ref}
        data-testid="switch-thumb"
        className={className}
        {...props}
      />
    )),
  };

  // Add display names
  SwitchPrimitive.Root.displayName = 'SwitchRoot';
  SwitchPrimitive.Thumb.displayName = 'SwitchThumb';

  return SwitchPrimitive;
});

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Switch Component', () => {
  it('renders with default props', () => {
    render(<Switch />);

    const root = screen.getByTestId('switch-root');
    const thumb = screen.getByTestId('switch-thumb');

    expect(root).toBeInTheDocument();
    expect(thumb).toBeInTheDocument();
    expect(root).toHaveAttribute('data-state', 'unchecked');
    expect(root).not.toBeDisabled();
  });

  it('handles checked state', () => {
    render(<Switch checked={true} />);

    const root = screen.getByTestId('switch-root');
    expect(root).toHaveAttribute('data-state', 'checked');
  });

  it('handles onCheckedChange callback', () => {
    const onCheckedChange = jest.fn();
    render(<Switch onCheckedChange={onCheckedChange} />);

    const root = screen.getByTestId('switch-root');
    fireEvent.click(root);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('handles disabled state', () => {
    render(<Switch disabled={true} />);

    const root = screen.getByTestId('switch-root');
    expect(root).toHaveAttribute('data-disabled', 'true');
    expect(root).toBeDisabled();
  });

  it('applies custom className', () => {
    const customClass = 'custom-switch';
    render(<Switch className={customClass} />);

    const root = screen.getByTestId('switch-root');
    expect(root).toHaveClass(customClass);
  });

  it('applies default styles to root', () => {
    render(<Switch />);

    const root = screen.getByTestId('switch-root');
    expect(root).toHaveClass('peer');
    expect(root).toHaveClass('inline-flex');
    expect(root).toHaveClass('h-[1.15rem]');
    expect(root).toHaveClass('w-8');
    expect(root).toHaveClass('shrink-0');
    expect(root).toHaveClass('items-center');
    expect(root).toHaveClass('rounded-full');
    expect(root).toHaveClass('border');
    expect(root).toHaveClass('border-transparent');
    expect(root).toHaveClass('shadow-xs');
    expect(root).toHaveClass('transition-all');
    expect(root).toHaveClass('outline-none');
  });

  it('applies default styles to thumb', () => {
    render(<Switch />);

    const thumb = screen.getByTestId('switch-thumb');
    expect(thumb).toHaveClass('bg-background');
    expect(thumb).toHaveClass('pointer-events-none');
    expect(thumb).toHaveClass('block');
    expect(thumb).toHaveClass('size-4');
    expect(thumb).toHaveClass('rounded-full');
    expect(thumb).toHaveClass('ring-0');
    expect(thumb).toHaveClass('transition-transform');
  });

  it('applies checked state styles', () => {
    render(<Switch checked={true} />);

    const root = screen.getByTestId('switch-root');
    const thumb = screen.getByTestId('switch-thumb');

    expect(root).toHaveClass('data-[state=checked]:bg-primary');
    expect(thumb).toHaveClass('data-[state=checked]:translate-x-[calc(100%-2px)]');
  });

  it('applies unchecked state styles', () => {
    render(<Switch checked={false} />);

    const root = screen.getByTestId('switch-root');
    const thumb = screen.getByTestId('switch-thumb');

    expect(root).toHaveClass('data-[state=unchecked]:bg-input');
    expect(thumb).toHaveClass('data-[state=unchecked]:translate-x-0');
  });

  it('applies focus styles', () => {
    render(<Switch />);

    const root = screen.getByTestId('switch-root');
    expect(root).toHaveClass('focus-visible:border-ring');
    expect(root).toHaveClass('focus-visible:ring-ring/50');
    expect(root).toHaveClass('focus-visible:ring-[3px]');
  });

  it('applies disabled styles', () => {
    render(<Switch disabled={true} />);

    const root = screen.getByTestId('switch-root');
    expect(root).toHaveClass('disabled:cursor-not-allowed');
    expect(root).toHaveClass('disabled:opacity-50');
  });

  it('forwards additional props', () => {
    render(
      <Switch
        data-testid="custom-switch"
        aria-label="Toggle switch"
      />
    );

    const root = screen.getByTestId('custom-switch');
    expect(root).toHaveAttribute('aria-label', 'Toggle switch');
  });
}); 