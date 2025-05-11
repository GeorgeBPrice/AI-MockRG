/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Textarea } from '@/components/ui/textarea';

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Textarea Component', () => {
  it('renders with default props', () => {
    render(<Textarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('data-slot', 'textarea');
  });

  it('handles value and onChange', () => {
    const handleChange = jest.fn();
    render(<Textarea value="test value" onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('test value');

    fireEvent.change(textarea, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles placeholder', () => {
    render(<Textarea placeholder="Enter text here" />);

    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Textarea disabled />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('handles required state', () => {
    render(<Textarea required />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();
  });

  it('handles readOnly state', () => {
    render(<Textarea readOnly />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('handles rows and cols', () => {
    render(<Textarea rows={5} cols={40} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('cols', '40');
  });

  it('handles maxLength', () => {
    render(<Textarea maxLength={100} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('handles aria attributes', () => {
    render(
      <Textarea
        aria-label="Description"
        aria-describedby="description-help"
        aria-invalid="true"
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'Description');
    expect(textarea).toHaveAttribute('aria-describedby', 'description-help');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies custom className', () => {
    const customClass = 'custom-textarea';
    render(<Textarea className={customClass} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass(customClass);
  });

  it('applies default styles', () => {
    render(<Textarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-input');
    expect(textarea).toHaveClass('placeholder:text-muted-foreground');
    expect(textarea).toHaveClass('focus-visible:border-ring');
    expect(textarea).toHaveClass('focus-visible:ring-ring/50');
    expect(textarea).toHaveClass('aria-invalid:ring-destructive/20');
    expect(textarea).toHaveClass('dark:aria-invalid:ring-destructive/40');
    expect(textarea).toHaveClass('aria-invalid:border-destructive');
    expect(textarea).toHaveClass('dark:bg-input/30');
    expect(textarea).toHaveClass('flex');
    expect(textarea).toHaveClass('field-sizing-content');
    expect(textarea).toHaveClass('min-h-16');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('rounded-md');
    expect(textarea).toHaveClass('border');
    expect(textarea).toHaveClass('bg-transparent');
    expect(textarea).toHaveClass('px-3');
    expect(textarea).toHaveClass('py-2');
    expect(textarea).toHaveClass('text-base');
    expect(textarea).toHaveClass('shadow-xs');
    expect(textarea).toHaveClass('transition-[color,box-shadow]');
    expect(textarea).toHaveClass('outline-none');
    expect(textarea).toHaveClass('focus-visible:ring-[3px]');
    expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    expect(textarea).toHaveClass('disabled:opacity-50');
    expect(textarea).toHaveClass('md:text-sm');
  });

  it('forwards additional props', () => {
    render(
      <Textarea
        data-testid="custom-textarea"
        name="description"
        form="test-form"
      />
    );

    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toHaveAttribute('name', 'description');
    expect(textarea).toHaveAttribute('form', 'test-form');
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    render(<Textarea onFocus={handleFocus} onBlur={handleBlur} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);
    expect(handleFocus).toHaveBeenCalled();

    fireEvent.blur(textarea);
    expect(handleBlur).toHaveBeenCalled();
  });

  it('handles key events', () => {
    const handleKeyDown = jest.fn();
    const handleKeyUp = jest.fn();
    render(<Textarea onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalled();

    fireEvent.keyUp(textarea, { key: 'Enter' });
    expect(handleKeyUp).toHaveBeenCalled();
  });

  it('handles mouse events', () => {
    const handleMouseEnter = jest.fn();
    const handleMouseLeave = jest.fn();
    render(
      <Textarea
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.mouseEnter(textarea);
    expect(handleMouseEnter).toHaveBeenCalled();

    fireEvent.mouseLeave(textarea);
    expect(handleMouseLeave).toHaveBeenCalled();
  });
}); 