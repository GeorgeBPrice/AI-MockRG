/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock @radix-ui/react-select
jest.mock('@radix-ui/react-select', () => {
  let currentRootOnValueChange: ((value: string) => void) | undefined;
  let currentRootOnOpenChange: ((open: boolean) => void) | undefined;

  const SelectRoot = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'> & {
      value?: string;
      onValueChange?: (value: string) => void;
      defaultValue?: string;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      disabled?: boolean;
    }
  >(({ children, value, onValueChange, defaultValue, open, onOpenChange, disabled, ...props }, ref) => {
    currentRootOnValueChange = onValueChange;
    currentRootOnOpenChange = onOpenChange;
    return (
      <div
        ref={ref}
        data-testid="select-root"
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled}
        data-value={value}
        data-default-value={defaultValue}
        {...props}
      >
        {children}
      </div>
    );
  });
  SelectRoot.displayName = 'SelectRoot';

  const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; size?: 'sm' | 'default' }
  >(({ children, className, size, ...props }, ref) => (
    <button
      ref={ref}
      data-testid="select-trigger"
      data-size={size}
      className={className}
      onClick={() => currentRootOnOpenChange?.(true)}
      {...props}
    >
      {children}
      <span data-testid="select-icon">▼</span>
    </button>
  ));
  SelectTrigger.displayName = 'SelectTrigger';

  const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
  >(({ children, ...props }, ref) => (
    <span ref={ref} data-testid="select-value" {...props}>{children}</span>
  ));
  SelectValue.displayName = 'SelectValue';

  const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { position?: 'popper' | 'item-aligned'; className?: string }
  >(({ children, position, className, ...props }, ref) => (
    <div ref={ref} data-testid="select-content" data-position={position} className={className} {...props}>
      {children}
    </div>
  ));
  SelectContent.displayName = 'SelectContent';

  const SelectGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="select-group" {...props}>{children}</div>
  ));
  SelectGroup.displayName = 'SelectGroup';

  const SelectLabel = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >(({ children, className, ...props }, ref) => (
    <div ref={ref} data-testid="select-label" className={className} {...props}>{children}</div>
  ));
  SelectLabel.displayName = 'SelectLabel';

  const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean; className?: string }
  >(({ children, value, disabled, className, ...props }, ref) => (
    <div
      ref={ref}
      data-testid="select-item"
      data-value={value}
      data-disabled={disabled}
      className={className}
      onClick={(e) => {
        if (!disabled) {
          currentRootOnValueChange?.(value);
          currentRootOnOpenChange?.(false);
          if (typeof props.onClick === 'function') {
            props.onClick(e);
          }
        }
      }}
      {...props}
    >
      {children}
      <span data-testid="select-item-indicator">✓</span>
    </div>
  ));
  SelectItem.displayName = 'SelectItem';

  const SelectSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <div ref={ref} data-testid="select-separator" className={className} {...props} />
  ));
  SelectSeparator.displayName = 'SelectSeparator';

  const SelectScrollUpButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <button ref={ref} data-testid="select-scroll-up-button" className={className} {...props}>▲</button>
  ));
  SelectScrollUpButton.displayName = 'SelectScrollUpButton';

  const SelectScrollDownButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <button ref={ref} data-testid="select-scroll-down-button" className={className} {...props}>▼</button>
  ));
  SelectScrollDownButton.displayName = 'SelectScrollDownButton';

  const Portal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Portal.displayName = 'SelectPortal';

  const Viewport = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { className?: string }
  >(({ className, ...props }, ref) => (
    <div ref={ref} data-testid="select-viewport" className={className} {...props} />
  ));
  Viewport.displayName = 'SelectViewport';

  const Icon = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Icon.displayName = 'SelectIcon';

  const ItemIndicator = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  ItemIndicator.displayName = 'SelectItemIndicator';

  const ItemText = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  ItemText.displayName = 'SelectItemText';

  return {
    Root: SelectRoot,
    Trigger: SelectTrigger,
    Value: SelectValue,
    Content: SelectContent,
    Group: SelectGroup,
    Label: SelectLabel,
    Item: SelectItem,
    Separator: SelectSeparator,
    ScrollUpButton: SelectScrollUpButton,
    ScrollDownButton: SelectScrollDownButton,
    Portal,
    Viewport,
    Icon,
    ItemIndicator,
    ItemText,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckIcon: () => <span data-testid="check-icon">✓</span>,
  ChevronDownIcon: () => <span data-testid="chevron-down-icon">▼</span>,
  ChevronUpIcon: () => <span data-testid="chevron-up-icon">▲</span>,
}));

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Select Component', () => {
  describe('Select Root', () => {
    it('renders with default props', () => {
      render(
        <Select>
          <SelectTrigger>Select an option</SelectTrigger>
        </Select>
      );

      const root = screen.getByTestId('select-root');
      expect(root).toBeInTheDocument();
      expect(root).toHaveAttribute('data-state', 'closed');
    });

    it('handles open state', () => {
      render(
        <Select open={true}>
          <SelectTrigger>Select an option</SelectTrigger>
        </Select>
      );

      const root = screen.getByTestId('select-root');
      expect(root).toHaveAttribute('data-state', 'open');
    });

    it('handles value changes', () => {
      const onValueChange = jest.fn();
      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger>Select an option</SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const root = screen.getByTestId('select-root');
      fireEvent.click(root);

      const item = screen.getByTestId('select-item');
      fireEvent.click(item);

      expect(onValueChange).toHaveBeenCalledWith('option1');
    });

    it('handles disabled state', () => {
      render(
        <Select disabled={true}>
          <SelectTrigger>Select an option</SelectTrigger>
        </Select>
      );

      const root = screen.getByTestId('select-root');
      expect(root).toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('SelectTrigger', () => {
    it('renders with default props', () => {
      render(<SelectTrigger>Select an option</SelectTrigger>);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-size', 'default');
    });

    it('renders with small size', () => {
      render(<SelectTrigger size="sm">Select an option</SelectTrigger>);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveAttribute('data-size', 'sm');
    });

    it('applies custom className', () => {
      const customClass = 'custom-trigger';
      render(<SelectTrigger className={customClass}>Select an option</SelectTrigger>);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass(customClass);
    });

    it('renders with icon', () => {
      render(<SelectTrigger>Select an option</SelectTrigger>);

      const icon = screen.getByTestId('select-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('SelectContent', () => {
    it('renders with default props', () => {
      render(
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      );

      const content = screen.getByTestId('select-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-position', 'popper');
    });

    it('renders with item-aligned position', () => {
      render(
        <SelectContent position="item-aligned">
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      );

      const content = screen.getByTestId('select-content');
      expect(content).toHaveAttribute('data-position', 'item-aligned');
    });

    it('applies custom className', () => {
      const customClass = 'custom-content';
      render(
        <SelectContent className={customClass}>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      );

      const content = screen.getByTestId('select-content');
      expect(content).toHaveClass(customClass);
    });
  });

  describe('SelectItem', () => {
    it('renders with default props', () => {
      render(<SelectItem value="option1">Option 1</SelectItem>);

      const item = screen.getByTestId('select-item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveAttribute('data-value', 'option1');
    });

    it('handles disabled state', () => {
      render(<SelectItem value="option1" disabled>Option 1</SelectItem>);

      const item = screen.getByTestId('select-item');
      expect(item).toHaveAttribute('data-disabled', 'true');
    });

    it('applies custom className', () => {
      const customClass = 'custom-item';
      render(<SelectItem value="option1" className={customClass}>Option 1</SelectItem>);

      const item = screen.getByTestId('select-item');
      expect(item).toHaveClass(customClass);
    });

    it('renders with indicator', () => {
      render(<SelectItem value="option1">Option 1</SelectItem>);

      const indicator = screen.getByTestId('select-item-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('SelectGroup', () => {
    it('renders with children', () => {
      render(
        <SelectGroup>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectGroup>
      );

      const group = screen.getByTestId('select-group');
      expect(group).toBeInTheDocument();
      expect(screen.getByTestId('select-item')).toBeInTheDocument();
    });
  });

  describe('SelectLabel', () => {
    it('renders with children', () => {
      render(<SelectLabel>Group Label</SelectLabel>);

      const label = screen.getByTestId('select-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Group Label');
    });

    it('applies custom className', () => {
      const customClass = 'custom-label';
      render(<SelectLabel className={customClass}>Group Label</SelectLabel>);

      const label = screen.getByTestId('select-label');
      expect(label).toHaveClass(customClass);
    });
  });

  describe('SelectSeparator', () => {
    it('renders with default props', () => {
      render(<SelectSeparator />);

      const separator = screen.getByTestId('select-separator');
      expect(separator).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const customClass = 'custom-separator';
      render(<SelectSeparator className={customClass} />);

      const separator = screen.getByTestId('select-separator');
      expect(separator).toHaveClass(customClass);
    });
  });

  describe('SelectScrollUpButton', () => {
    it('renders with default props', () => {
      render(<SelectScrollUpButton />);

      const button = screen.getByTestId('select-scroll-up-button');
      expect(button).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const customClass = 'custom-scroll-up';
      render(<SelectScrollUpButton className={customClass} />);

      const button = screen.getByTestId('select-scroll-up-button');
      expect(button).toHaveClass(customClass);
    });
  });

  describe('SelectScrollDownButton', () => {
    it('renders with default props', () => {
      render(<SelectScrollDownButton />);

      const button = screen.getByTestId('select-scroll-down-button');
      expect(button).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const customClass = 'custom-scroll-down';
      render(<SelectScrollDownButton className={customClass} />);

      const button = screen.getByTestId('select-scroll-down-button');
      expect(button).toHaveClass(customClass);
    });
  });

  describe('SelectValue', () => {
    it('renders with children', () => {
      render(<SelectValue>Selected Value</SelectValue>);

      const value = screen.getByTestId('select-value');
      expect(value).toBeInTheDocument();
      expect(value).toHaveTextContent('Selected Value');
    });
  });

  describe('Integration', () => {
    it('handles complete select interaction', () => {
      const onValueChange = jest.fn();
      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectSeparator />
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      // Open select
      const trigger = screen.getByTestId('select-trigger');
      fireEvent.click(trigger);

      // Select an option
      const item = screen.getByText('Option 1');
      fireEvent.click(item);

      expect(onValueChange).toHaveBeenCalledWith('option1');
    });
  });
}); 