import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '../../components/Spinner';

describe('Spinner Component', () => {
  it('renders spinner with default props', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'loading');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-solid');
  });

  it('renders with medium size by default', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-10', 'w-10', 'border-3');
  });

  it('renders with primary color by default', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-t-blue-600', 'border-gray-300');
  });

  it('renders with small size', () => {
    render(<Spinner size="sm" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-6', 'w-6', 'border-2');
  });

  it('renders with large size', () => {
    render(<Spinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-16', 'w-16', 'border-4');
  });

  it('renders with white color', () => {
    render(<Spinner color="white" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-t-white', 'border-white/30');
  });

  it('renders with custom hex color', () => {
    const customColor = '#ff0000';
    render(<Spinner color={customColor} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({
      borderColor: '#e5e7eb',
      borderTopColor: customColor
    });
  });

  it('renders with different size and color combinations', () => {
    render(<Spinner size="lg" color="white" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-16', 'w-16', 'border-4');
    expect(spinner).toHaveClass('border-t-white', 'border-white/30');
  });

  it('includes screen reader text', () => {
    render(<Spinner />);
    
    const screenReaderText = screen.getByText('Loading...');
    expect(screenReaderText).toBeInTheDocument();
    expect(screenReaderText).toHaveClass('sr-only');
  });

  it('has proper accessibility attributes', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'loading');
  });

  it('applies correct CSS classes for animation and styling', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-solid');
  });

  it('handles invalid size gracefully', () => {
    // @ts-ignore - Testing invalid prop
    render(<Spinner size="invalid" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    // Should still render with some classes
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-solid');
  });

  it('handles invalid color gracefully', () => {
    // @ts-ignore - Testing invalid prop
    render(<Spinner color="invalid" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    // Should still render with basic classes
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-solid');
  });
});