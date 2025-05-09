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

// Mock the next/link component
jest.mock('next/link', () => {
  // Create a proper passthrough mock that renders its children and href
  const NextLinkMock = React.forwardRef<
    HTMLAnchorElement, 
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >(({ href, children, ...rest }, ref) => (
    <a href={href} ref={ref} data-testid="next-link" {...rest}>
      {children}
    </a>
  ));
  
  NextLinkMock.displayName = 'NextLinkMock';
  return NextLinkMock;
});

// Mock the Button component to render a regular button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    children: React.ReactNode;
  }) => {
    if (asChild && React.isValidElement(children)) {
      // Handle asChild case by cloning the child with the props
      const childProps = {
        ...props,
        'data-variant': variant,
        'data-size': size,
        'data-button': true,
      };
      
      return React.cloneElement(children, childProps);
    }
    return (
      <button 
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );
  }
}));

// Now we can import our component
import { SchemaCard } from '@/components/schema/SchemaCard';
import { SavedSchema } from '@/lib/storage';

// Mock the DeleteSchemaButton component
jest.mock('@/components/generator/delete-schema-button', () => {
  return function MockDeleteButton({ onSuccess }: { onSuccess: () => void }) {
    return <button data-testid="delete-button" onClick={onSuccess}>Delete</button>;
  };
});

// Mock lucide-react icons - lol why not.
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" className="mr-1 h-3 w-3" />,
  Link: () => <div data-testid="edit-link-icon">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-2"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
    Edit
  </div>,
  ExternalLink: () => <div data-testid="edit-link-icon" className="mr-2 h-4 w-4">Load</div>
}));

describe('SchemaCard Component', () => {
  const mockSchema: SavedSchema = {
    id: 'schema-123',
    name: 'Test Schema',
    schema: 'CREATE TABLE users (id INT, name TEXT)',
    schemaType: 'sql',
    createdAt: 1621500000000,
    updatedAt: 1621500000000,
    userId: 'user-123'
  };

  const mockUserId = 'user-123';
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays the schema name and type correctly', () => {
    render(
      <SchemaCard 
        schema={mockSchema} 
        userId={mockUserId}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Schema')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
  });

  it('displays the formatted update date', () => {
    render(
      <SchemaCard 
        schema={mockSchema} 
        userId={mockUserId}
        onDelete={mockOnDelete}
      />
    );

    // The format will depend on the user's locale, we'll check for parts of the date
    expect(screen.getByText(/May/)).toBeInTheDocument();
    expect(screen.getByText(/2021/)).toBeInTheDocument();
  });

  it('displays "No description" when description is missing', () => {
    render(
      <SchemaCard 
        schema={mockSchema} 
        userId={mockUserId}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('displays the description when provided', () => {
    const schemaWithDescription = {
      ...mockSchema,
      description: 'This is a test schema description'
    };

    render(
      <SchemaCard 
        schema={schemaWithDescription} 
        userId={mockUserId}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('This is a test schema description')).toBeInTheDocument();
  });

  it('calls onDelete callback when delete button is clicked', () => {
    render(
      <SchemaCard 
        schema={mockSchema} 
        userId={mockUserId}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByTestId('delete-button'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockSchema.id);
  });

  it('verifies the edit icons exist', () => {
    render(
      <SchemaCard 
        schema={mockSchema} 
        userId={mockUserId}
        onDelete={mockOnDelete}
      />
    );

    // Check for the presence of edit icons
    const editIcons = screen.getAllByTestId('edit-link-icon');
    
    // Check that at least one edit icon exists
    expect(editIcons.length).toBeGreaterThan(0);
    
    // At least one edit icon should contain "Edit" text
    expect(editIcons.some(icon => icon.textContent?.includes('Edit'))).toBeTruthy();
  });
}); 