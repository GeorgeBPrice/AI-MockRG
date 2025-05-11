/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '@/components/ui/badge';

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);

    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('border');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
    expect(badge).toHaveClass('font-semibold');
    expect(badge).toHaveClass('border-transparent');
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);

    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('border-transparent');
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('text-secondary-foreground');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);

    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('border-transparent');
    expect(badge).toHaveClass('bg-destructive');
    expect(badge).toHaveClass('text-destructive-foreground');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);

    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('border-transparent');
  });

  it('applies custom className', () => {
    const customClass = 'custom-badge';
    render(<Badge className={customClass}>Custom Badge</Badge>);

    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass(customClass);
  });

  it('forwards additional props', () => {
    render(
      <Badge data-testid="test-badge" aria-label="Test Badge">
        Test Badge
      </Badge>
    );

    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('aria-label', 'Test Badge');
  });

  it('applies hover styles', () => {
    render(<Badge>Hover Badge</Badge>);

    const badge = screen.getByText('Hover Badge');
    expect(badge).toHaveClass('hover:bg-primary/80');
  });

  it('applies focus styles', () => {
    render(<Badge>Focus Badge</Badge>);

    const badge = screen.getByText('Focus Badge');
    expect(badge).toHaveClass('focus:outline-none');
    expect(badge).toHaveClass('focus:ring-2');
    expect(badge).toHaveClass('focus:ring-ring');
    expect(badge).toHaveClass('focus:ring-offset-2');
  });

  it('applies transition styles', () => {
    render(<Badge>Transition Badge</Badge>);

    const badge = screen.getByText('Transition Badge');
    expect(badge).toHaveClass('transition-colors');
  });

  it('renders with different variants and custom class', () => {
    const customClass = 'custom-badge';
    render(
      <Badge variant="secondary" className={customClass}>
        Combined Badge
      </Badge>
    );

    const badge = screen.getByText('Combined Badge');
    expect(badge).toHaveClass(customClass);
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('text-secondary-foreground');
  });
}); 