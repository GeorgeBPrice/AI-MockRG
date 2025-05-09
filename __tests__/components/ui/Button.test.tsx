/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next.js modules before importing components that depend on them
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn()
  }
}));

// Mock lib/utils.ts which may be importing from next/server
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

// Import Button component after mocking dependencies
import { Button } from '@/components/ui/button';

// Mock Slot from @radix-ui/react-slot
jest.mock('@radix-ui/react-slot', () => {
  const MockSlot = React.forwardRef<
    HTMLDivElement, 
    React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
  >((props, ref) => {
    const { children, ...rest } = props;
    return (
      <div ref={ref} data-testid="slot-component" {...rest}>
        {children}
      </div>
    );
  });
  
  // Add display name
  MockSlot.displayName = 'MockSlot';
  
  return {
    Slot: MockSlot
  };
});

describe('Button Component', () => {
  it('renders a button with default variant and size', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    
    // Default variant classes should be applied
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
    
    // Default size classes should be applied
    expect(button).toHaveClass('h-9');
    expect(button).toHaveClass('px-4');
  });

  it('renders a button with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toBeInTheDocument();
    
    // Destructive variant classes should be applied
    expect(button).toHaveClass('bg-destructive');
    expect(button).toHaveClass('text-white');
  });

  it('renders a button with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button).toBeInTheDocument();
    
    // Outline variant classes should be applied
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('bg-background');
  });

  it('renders a button with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button', { name: 'Small' });
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('px-3');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: 'Large' });
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-6');
    
    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button', { name: 'Icon' });
    expect(button).toHaveClass('size-9');
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom' });
    expect(button).toHaveClass('custom-class');
  });

  it('applies disabled styling when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
    // Check for disabled styles
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('fires onClick event when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    // Should find a Slot component instead of a button
    const slotComponent = screen.getByTestId('slot-component');
    expect(slotComponent).toBeInTheDocument();
    expect(slotComponent.textContent).toBe('Link Button');
  });
}); 