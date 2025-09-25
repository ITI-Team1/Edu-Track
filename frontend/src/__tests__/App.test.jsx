import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    isAuthenticated: vi.fn(() => false),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the routes
vi.mock('../routes/RoutesList', () => ({
  default: () => <div data-testid="routes-list">Routes List</div>,
}));

// Mock components
vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('../components/PlexusBackground', () => ({
  default: () => <div data-testid="plexus-background">Plexus Background</div>,
}));

vi.mock('../components/ScrollToTop', () => ({
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

const TestWrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App', () => {
  it('renders the main app structure', () => {
    render(<App />, { wrapper: TestWrapper });

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('plexus-background')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-to-top')).toBeInTheDocument();
    expect(screen.getByTestId('routes-list')).toBeInTheDocument();
  });

  it('renders the toast container', () => {
    render(<App />, { wrapper: TestWrapper });

    // Check if toast container is present (it should be in the DOM)
    const toastContainer = document.querySelector('.Toastify__toast-container');
    expect(toastContainer).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    render(<App />, { wrapper: TestWrapper });

    const appElement = screen.getByText('Routes List').closest('.App');
    expect(appElement).toBeInTheDocument();
    expect(appElement).toHaveClass('App');

    const mainElement = screen.getByText('Routes List').closest('.main-content');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('main-content');
  });

  it('provides QueryClient and AuthProvider context', () => {
    // This test ensures the providers are properly set up
    // The actual functionality is tested in the AuthContext tests
    render(<App />, { wrapper: TestWrapper });

    // If we get here without errors, the providers are working
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });
});
