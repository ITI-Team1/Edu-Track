import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

// Mock the AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  loading: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => mockAuthContext),
  AuthProvider: ({ children }) => children
}));

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.loading = false;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading message when authentication is loading', () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.loading = true;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.loading = false;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    // The Navigate component should redirect to /login
    // In a real test environment, this would trigger a navigation
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('handles authentication state changes', () => {
    // Test loading state
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.loading = true;

    const { rerender } = render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();

    // Test authenticated state
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.loading = false;

    rerender(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('جاري التحميل...')).not.toBeInTheDocument();
  });

  it('renders multiple children correctly when authenticated', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.loading = false;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>First Child</div>
          <div>Second Child</div>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('uses correct AuthContext values', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.loading = false;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    // The component should render the protected content when authenticated
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('handles edge case when loading is true and authenticated is true', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.loading = true;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    // Should show loading even if authenticated
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
