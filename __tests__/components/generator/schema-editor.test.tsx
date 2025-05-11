/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SchemaEditor from '@/components/generator/schema-editor';

// Mock @monaco-editor/react
jest.mock('@monaco-editor/react', () => ({
  Editor: ({ 
    value, 
    onChange, 
    language, 
    options,
    onMount
  }: { 
    value: string; 
    onChange: (value: string | undefined) => void; 
    language: string; 
    onMount?: (editor: unknown, monaco: unknown) => void;
    options: Record<string, unknown>;
  }) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: () => value,
          setValue: (val: string) => onChange(val),
          updateOptions: jest.fn(),
        };
        const mockMonaco = { };
        
        // Use setTimeout to ensure onMount is called after the initial render cycle
        const timerId = setTimeout(() => {
          onMount(mockEditor, mockMonaco);
        }, 0);
        return () => clearTimeout(timerId);
      }
    }, [onMount, value, onChange]);

    return (
      <div 
        data-testid="monaco-editor" 
        data-language={language}
        data-readonly={options.readOnly}
      >
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={options.readOnly as boolean}
        />
      </div>
    );
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="clear-icon">X</span>,
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ 
    children, 
    onClick, 
    disabled, 
    variant, 
    size, 
    className, 
    title 
  }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    disabled?: boolean; 
    variant?: string;
    size?: string;
    className?: string;
    title?: string;
  }) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
      title={title}
    >
      {children}
    </button>
  ),
}));

describe('SchemaEditor Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    type: 'sql' as const,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor container initially', () => {
    render(<SchemaEditor {...defaultProps} />);
    // verify that the editor container is present
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('renders editor after mounting', async () => {
    render(<SchemaEditor {...defaultProps} />);

    // Wait for mounted state
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-language', 'sql');
  });

  it('sets correct language based on type', async () => {
    const { rerender } = render(<SchemaEditor {...defaultProps} type="sql" />);
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-language', 'sql');
    });

    rerender(<SchemaEditor {...defaultProps} type="nosql" />);
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-language', 'json');
    });

    rerender(<SchemaEditor {...defaultProps} type="sample" />);
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-language', 'json');
    });
  });

  it('handles value changes', async () => {
    render(<SchemaEditor {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('editor-textarea')).toBeInTheDocument();
    });

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'SELECT * FROM users;' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('SELECT * FROM users;');
  });

  it('shows clear button when value is not empty', async () => {
    render(<SchemaEditor {...defaultProps} value="SELECT * FROM users;" />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const clearButton = screen.getByTestId('button');
    expect(clearButton).toHaveAttribute('title', 'Clear editor');
    expect(clearButton).toHaveAttribute('data-variant', 'ghost');
    expect(clearButton).toHaveAttribute('data-size', 'icon');
  });

  it('handles clear button click', async () => {
    render(<SchemaEditor {...defaultProps} value="SELECT * FROM users;" />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const clearButton = screen.getByTestId('button');
    fireEvent.click(clearButton);

    expect(defaultProps.onChange).toHaveBeenCalledWith('');
  });

  it('disables editor when disabled prop is true', async () => {
    render(<SchemaEditor {...defaultProps} disabled={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-readonly', 'true');
    });

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('disables clear button when editor is disabled', async () => {
    render(<SchemaEditor {...defaultProps} value="SELECT * FROM users;" disabled={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const clearButton = screen.getByTestId('button');
    expect(clearButton).toBeDisabled();
  });

  it('handles editor mount', async () => {
    render(<SchemaEditor {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    // The editor should be mounted and ready
    expect(screen.getByTestId('editor-textarea')).toBeInTheDocument();
  });
}); 