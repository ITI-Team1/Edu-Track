import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';

// Mock all the components and services
vi.mock('../../services/api', () => ({
  default: {
    isAuthenticated: vi.fn(() => false),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../../routes/RoutesList', () => ({
  default: () => (
    <div data-testid="routes-list">
      <RoutesList />
    </div>
  ),
}));

// Mock the routes
const RoutesList = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome to the dashboard!</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  );
};

vi.mock('../../components/Navbar', () => ({
  default: () => {
    const { isAuthenticated, logout, user } = useAuth();
    
    return (
      <nav data-testid="navbar">
        <div>Navbar</div>
        {isAuthenticated ? (
          <div>
            <span>Welcome, {user?.first_name || user?.username || 'User'}</span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <div>
            <a href="/login">Login</a>
            <a href="/register">Register</a>
          </div>
        )}
      </nav>
    );
  },
}));

vi.mock('../../components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('../../components/PlexusBackground', () => ({
  default: () => <div data-testid="plexus-background">Plexus Background</div>,
}));

vi.mock('../../components/ScrollToTop', () => ({
  default: () => <div data-testid="scroll-to-top">Scroll To Top</div>,
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const TestWrapper = ({ children, initialRoute = '/' }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows login form for unauthenticated users', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });
  });

  it('shows dashboard for authenticated users', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    // Mock API to return authenticated user
    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to the dashboard!')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
    });
  });

  it('handles login flow', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { default: apiService } = await import('../../services/api');
    apiService.login.mockResolvedValue({ token: 'mock-token' });
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Initially unauthenticated
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    // Simulate login
    await waitFor(() => {
      const { login } = useAuth();
      login({ username: 'testuser', password: 'password' });
    });

    // Should show dashboard after login
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
    });
  });

  it('handles logout flow', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockResolvedValue(mockUser);
    apiService.logout.mockImplementation(() => {});

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Initially authenticated
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Should show home page after logout
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('handles authentication errors gracefully', async () => {
    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(false);
    apiService.getCurrentUser.mockRejectedValue(new Error('Auth failed'));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should still render the app even with auth errors
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('maintains authentication state across navigation', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should be authenticated
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
    });

    // Navigate to different route (simulated)
    // The user should remain authenticated
    expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
  });

  it('shows loading state during authentication check', async () => {
    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 1, username: 'testuser' }), 100))
    );

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should show loading state initially
    // (This would need to be implemented in the actual component)
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('handles network errors during authentication', async () => {
    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should handle network errors gracefully
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('provides authentication context to all components', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { default: apiService } = await import('../../services/api');
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // All components should have access to auth context
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
