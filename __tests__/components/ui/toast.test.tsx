/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ToastProvider,
  Toast,
  ToastClose,
  ToastTitle,
  ToastDescription,
} from '@/components/ui/toast';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon">×</span>,
}));

// Mock lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Toast Components', () => {
  describe('ToastProvider', () => {
    it('renders with default props', () => {
      render(
        <ToastProvider>
          <div>Toast content</div>
        </ToastProvider>
      );

      const provider = screen.getByRole('region', { name: 'toast-provider' });
      expect(provider).toBeInTheDocument();
      expect(provider).toHaveClass('fixed');
      expect(provider).toHaveClass('top-0');
      expect(provider).toHaveClass('z-[100]');
      expect(provider).toHaveClass('flex');
      expect(provider).toHaveClass('max-h-screen');
      expect(provider).toHaveClass('w-full');
      expect(provider).toHaveClass('flex-col-reverse');
      expect(provider).toHaveClass('p-4');
    });

    it('applies custom className', () => {
      const customClass = 'custom-provider';
      render(
        <ToastProvider className={customClass}>
          <div>Toast content</div>
        </ToastProvider>
      );

      const provider = screen.getByRole('region', { name: 'toast-provider' });
      expect(provider).toHaveClass(customClass);
    });

    it('forwards additional props', () => {
      render(
        <ToastProvider data-testid="custom-provider" aria-label="Toast notifications">
          <div>Toast content</div>
        </ToastProvider>
      );

      const provider = screen.getByTestId('custom-provider');
      expect(provider).toHaveAttribute('aria-label', 'Toast notifications');
    });

    it('renders ToastProvider', () => {
      render(<ToastProvider>Test Provider</ToastProvider>);
      const provider = screen.getByRole('region', { name: 'toast-provider' });
      expect(provider).toBeInTheDocument();
      expect(provider).toHaveTextContent('Test Provider');
    });
  });

  describe('Toast', () => {
    it('renders with default variant', () => {
      render(
        <Toast>
          <div>Toast content</div>
        </Toast>
      );

      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('border');
      expect(toast).toHaveClass('bg-background');
      expect(toast).toHaveClass('text-foreground');
    });

    it('renders with destructive variant', () => {
      render(
        <Toast variant="destructive">
          <div>Destructive toast</div>
        </Toast>
      );

      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toHaveClass('destructive');
      expect(toast).toHaveClass('border-destructive');
      expect(toast).toHaveClass('bg-destructive');
      expect(toast).toHaveClass('text-destructive-foreground');
    });

    it('renders with success variant', () => {
      render(
        <Toast variant="success">
          <div>Success toast</div>
        </Toast>
      );

      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toHaveClass('border-green-500');
      expect(toast).toHaveClass('bg-green-100');
      expect(toast).toHaveClass('text-green-900');
      expect(toast).toHaveClass('dark:bg-green-900/20');
      expect(toast).toHaveClass('dark:border-green-500/30');
      expect(toast).toHaveClass('dark:text-green-300');
    });

    it('applies custom className', () => {
      const customClass = 'custom-toast';
      render(
        <Toast className={customClass}>
          <div>Toast content</div>
        </Toast>
      );

      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toHaveClass(customClass);
    });

    it('applies animation classes', () => {
      render(
        <Toast>
          <div>Toast content</div>
        </Toast>
      );

      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toHaveClass('data-[state=open]:animate-in');
      expect(toast).toHaveClass('data-[state=closed]:animate-out');
      expect(toast).toHaveClass('data-[state=closed]:fade-out-80');
      expect(toast).toHaveClass('data-[state=closed]:slide-out-to-right-full');
      expect(toast).toHaveClass('data-[state=open]:slide-in-from-top-full');
      expect(toast).toHaveClass('data-[state=open]:sm:slide-in-from-bottom-full');
    });

    it('applies swipe classes', () => {
      render(
        <Toast>
          <div>Toast content</div>
        </Toast>
      );

      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toHaveClass('data-[swipe=cancel]:translate-x-0');
      expect(toast).toHaveClass('data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]');
      expect(toast).toHaveClass('data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]');
      expect(toast).toHaveClass('data-[swipe=move]:transition-none');
      expect(toast).toHaveClass('data-[swipe=end]:animate-out');
    });

    it('renders default Toast', () => {
      render(<Toast>Test Toast</Toast>);
      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Test Toast');
    });

    it('renders Toast with destructive variant', () => {
      render(<Toast variant="destructive">Destructive Toast</Toast>);
      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('destructive');
    });

    it('renders Toast with success variant', () => {
      render(<Toast variant="success">Success Toast</Toast>);
      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('border-green-500');
    });

    it('applies custom className to Toast', () => {
      const customClass = 'my-custom-toast';
      render(<Toast className={customClass}>Custom Toast</Toast>);
      const toast = screen.getByRole('alert', { name: 'toast' });
      expect(toast).toHaveClass(customClass);
    });
  });

  describe('ToastClose', () => {
    it('renders with default props', () => {
      render(<ToastClose />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('absolute');
      expect(closeButton).toHaveClass('right-2');
      expect(closeButton).toHaveClass('top-2');
      expect(closeButton).toHaveClass('rounded-md');
      expect(closeButton).toHaveClass('p-1');
      expect(closeButton).toHaveClass('text-foreground/50');
      expect(closeButton).toHaveClass('opacity-100');
      expect(closeButton).toHaveClass('transition-opacity');
    });

    it('renders close icon', () => {
      render(<ToastClose />);

      const icon = screen.getByTestId('close-icon');
      expect(icon).toBeInTheDocument();
    });

    it('applies hover and focus styles', () => {
      render(<ToastClose />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('hover:text-foreground');
      expect(closeButton).toHaveClass('focus:opacity-100');
      expect(closeButton).toHaveClass('focus:outline-none');
      expect(closeButton).toHaveClass('focus:ring-2');
      expect(closeButton).toHaveClass('hover:bg-gray-100');
      expect(closeButton).toHaveClass('dark:hover:bg-gray-800');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<ToastClose onClick={handleClick} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('ToastTitle', () => {
    it('renders with default props', () => {
      render(<ToastTitle>Toast Title</ToastTitle>);

      const title = screen.getByText('Toast Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('font-semibold');
    });

    it('applies custom className', () => {
      const customClass = 'custom-title';
      render(<ToastTitle className={customClass}>Toast Title</ToastTitle>);

      const title = screen.getByText('Toast Title');
      expect(title).toHaveClass(customClass);
    });

    it('renders ToastTitle', () => {
      render(<ToastTitle>My Title</ToastTitle>);
      const title = screen.getByText('My Title');
      expect(title).toBeInTheDocument();
    });
  });

  describe('ToastDescription', () => {
    it('renders with default props', () => {
      render(<ToastDescription>Toast description</ToastDescription>);

      const description = screen.getByText('Toast description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('opacity-90');
    });

    it('applies custom className', () => {
      const customClass = 'custom-description';
      render(
        <ToastDescription className={customClass}>
          Toast description
        </ToastDescription>
      );

      const description = screen.getByText('Toast description');
      expect(description).toHaveClass(customClass);
    });

    it('renders ToastDescription', () => {
      render(<ToastDescription>My Description</ToastDescription>);
      const description = screen.getByText('My Description');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders a complete toast with all components', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Success!</ToastTitle>
            <ToastDescription>Operation completed successfully.</ToastDescription>
            <ToastClose />
          </Toast>
        </ToastProvider>
      );

      expect(screen.getByRole('heading')).toHaveTextContent('Success!');
      expect(screen.getByText('Operation completed successfully.')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('handles toast interaction', () => {
      const handleClose = jest.fn();
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Test Toast</ToastTitle>
            <ToastDescription>Test description</ToastDescription>
            <ToastClose onClick={handleClose} />
          </Toast>
        </ToastProvider>
      );

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    });
  });
}); 