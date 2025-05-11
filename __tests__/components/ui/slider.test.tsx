/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Slider } from '@/components/ui/slider';

// Mock @radix-ui/react-slider
jest.mock('@radix-ui/react-slider', () => {
  const SliderRoot = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & {
      defaultValue?: number[];
      value?: number[];
      min?: number;
      max?: number;
      step?: number;
      disabled?: boolean;
      orientation?: 'horizontal' | 'vertical';
      onValueChange?: (value: number[]) => void;
      onValueCommit?: (value: number[]) => void;
      className?: string;
    }
  >(({ children, defaultValue, value, min, max, step, disabled, orientation, onValueChange, onValueCommit, className, ...props }, ref) => {
    const currentVal = value || defaultValue || [(min ?? 0)]; // Default to single thumb if not specified
    return (
      <span
        ref={ref}
        data-testid="slider-root"
        data-orientation={orientation}
        data-disabled={disabled}
        data-min={min}
        data-max={max}
        data-step={step}
        data-value={currentVal.join(',')}
        data-default-value={defaultValue?.join(',')}
        className={className}
        onClick={() => {
          if (onValueChange) {
            const newValue = currentVal.map(v => Math.min(max ?? 100, (v || 0) + (step ?? 1)));
            onValueChange(newValue);
          }
        }}
        onMouseUp={() => {
          if (onValueCommit) {
            onValueCommit(currentVal);
          }
        }}
        {...props}
      >
        {children}
      </span>
    );
  });
  SliderRoot.displayName = 'SliderRoot';

  const SliderTrack = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <span ref={ref} data-testid="slider-track" className={className} {...props} />
  ));
  SliderTrack.displayName = 'SliderTrack';

  const SliderRange = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <span ref={ref} data-testid="slider-range" className={className} {...props} />
  ));
  SliderRange.displayName = 'SliderRange';

  const SliderThumb = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <span ref={ref} data-testid="slider-thumb" className={className} {...props} />
  ));
  SliderThumb.displayName = 'SliderThumb';

  return {
    Root: SliderRoot,
    Track: SliderTrack,
    Range: SliderRange,
    Thumb: SliderThumb,
  };
});

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Slider Component', () => {
  it('renders with default props', () => {
    render(<Slider />);

    const root = screen.getByTestId('slider-root');
    const track = screen.getByTestId('slider-track');
    const range = screen.getByTestId('slider-range');
    const thumbs = screen.getAllByTestId('slider-thumb');

    expect(root).toBeInTheDocument();
    expect(track).toBeInTheDocument();
    expect(range).toBeInTheDocument();
    expect(thumbs).toHaveLength(2);
  });

  it('renders with custom min and max values', () => {
    render(<Slider min={10} max={90} />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-min', '10');
    expect(root).toHaveAttribute('data-max', '90');
  });

  it('renders with custom step value', () => {
    render(<Slider step={5} />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-step', '5');
  });

  it('renders with vertical orientation', () => {
    render(<Slider orientation="vertical" />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-orientation', 'vertical');
  });

  it('handles disabled state', () => {
    render(<Slider disabled />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-disabled', 'true');
  });

  it('handles single value', () => {
    render(<Slider value={[50]} />); // Ensure value is an array

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-value', '50');
    expect(screen.getAllByTestId('slider-thumb')).toHaveLength(1);
  });

  it('handles array of values', () => {
    render(<Slider value={[25, 75]} />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-value', '25,75');
    expect(screen.getAllByTestId('slider-thumb')).toHaveLength(2);
  });

  it('handles defaultValue', () => {
    render(<Slider defaultValue={[30, 70]} />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveAttribute('data-default-value', '30,70');
  });

  it('handles value changes', () => {
    const onValueChange = jest.fn();
    render(<Slider value={[25]} onValueChange={onValueChange} min={0} max={100} step={1}/>);

    const root = screen.getByTestId('slider-root');
    fireEvent.click(root);
    expect(onValueChange).toHaveBeenCalledWith([26]);
  });

  it('handles value commit', () => {
    const onValueCommit = jest.fn();
    render(<Slider value={[25, 75]} onValueCommit={onValueCommit} />);

    const root = screen.getByTestId('slider-root');
    fireEvent.mouseUp(root);

    expect(onValueCommit).toHaveBeenCalledWith([25, 75]);
  });

  it('applies custom className', () => {
    const customClass = 'custom-slider';
    render(<Slider className={customClass} />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveClass(customClass);
  });

  it('applies default styles to root', () => {
    render(<Slider />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveClass('relative');
    expect(root).toHaveClass('flex');
    expect(root).toHaveClass('w-full');
    expect(root).toHaveClass('touch-none');
    expect(root).toHaveClass('items-center');
    expect(root).toHaveClass('select-none');
  });

  it('applies default styles to track', () => {
    render(<Slider />);

    const track = screen.getByTestId('slider-track');
    expect(track).toHaveClass('bg-muted');
    expect(track).toHaveClass('relative');
    expect(track).toHaveClass('grow');
    expect(track).toHaveClass('overflow-hidden');
    expect(track).toHaveClass('rounded-full');
  });

  it('applies default styles to range', () => {
    render(<Slider />);

    const range = screen.getByTestId('slider-range');
    expect(range).toHaveClass('bg-primary');
    expect(range).toHaveClass('absolute');
  });

  it('applies default styles to thumb', () => {
    render(<Slider />);

    const thumbs = screen.getAllByTestId('slider-thumb');
    expect(thumbs.length).toBeGreaterThan(0);
    const thumb = thumbs[0]; // Check styles on the first thumb

    expect(thumb).toHaveClass('border-primary');
    expect(thumb).toHaveClass('bg-background');
    expect(thumb).toHaveClass('ring-ring/50');
    expect(thumb).toHaveClass('block');
    expect(thumb).toHaveClass('size-4');
    expect(thumb).toHaveClass('shrink-0');
    expect(thumb).toHaveClass('rounded-full');
    expect(thumb).toHaveClass('border');
    expect(thumb).toHaveClass('shadow-sm');
    expect(thumb).toHaveClass('transition-[color,box-shadow]');
  });

  it('applies hover and focus styles to thumb', () => {
    render(<Slider />);

    const thumbs = screen.getAllByTestId('slider-thumb');
    expect(thumbs.length).toBeGreaterThanOrEqual(1);
    const thumb = thumbs[0];

    expect(thumb).toHaveClass('hover:ring-4');
    expect(thumb).toHaveClass('focus-visible:ring-4');
    expect(thumb).toHaveClass('focus-visible:outline-hidden');
  });

  it('applies disabled styles', () => {
    render(<Slider disabled />);

    const root = screen.getByTestId('slider-root');
    const thumbs = screen.getAllByTestId('slider-thumb');
    expect(thumbs.length).toBeGreaterThanOrEqual(1);
    const thumb = thumbs[0];

    expect(root).toHaveClass('data-[disabled]:opacity-50');
    expect(thumb).toHaveClass('disabled:pointer-events-none');
    expect(thumb).toHaveClass('disabled:opacity-50');
  });

  it('applies vertical orientation styles', () => {
    render(<Slider orientation="vertical" />);

    const root = screen.getByTestId('slider-root');
    expect(root).toHaveClass('data-[orientation=vertical]:h-full');
    expect(root).toHaveClass('data-[orientation=vertical]:min-h-44');
    expect(root).toHaveClass('data-[orientation=vertical]:w-auto');
    expect(root).toHaveClass('data-[orientation=vertical]:flex-col');
  });
}); 