import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '../../components/Navbar';

// Mock the logo asset
vi.mock('../../assets/psu-logo.svg', () => ({
  default: 'mocked-logo.svg',
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn(cb => setTimeout(cb, 0)),
  writable: true,
});

// Mock AuthContext
const mockLogout = vi.fn();
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  logout: mockLogout,
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
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
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to unauthenticated state by default
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
  });

  it('renders navbar with logo and brand name', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const logo = screen.getByAltText('جامعة بورسعيد');
    const brandName = screen.getByText('جامعة بورسعيد');
    
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'mocked-logo.svg');
    expect(brandName).toBeInTheDocument();
  });

  it('renders navigation links for unauthenticated users', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    expect(screen.getByText('الرئيسية')).toBeInTheDocument();
    expect(screen.getByText('المميزات')).toBeInTheDocument();
    expect(screen.getByText('حول')).toBeInTheDocument();
    expect(screen.getByText('مركز المساعدة')).toBeInTheDocument();
    expect(screen.getByText('اتصل بنا')).toBeInTheDocument();
  });

  it('renders login button for unauthenticated users', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const loginButton = screen.getByRole('link', { name: /تسجيل الدخول/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute('href', '/login');
  });

  it('renders navigation links for authenticated users', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, username: 'testuser' };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    expect(screen.getByText('الصفحة الرئيسية')).toBeInTheDocument();
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
    expect(screen.getByText('حول')).toBeInTheDocument();
    expect(screen.getByText('مركز المساعدة')).toBeInTheDocument();
    expect(screen.getByText('اتصل بنا')).toBeInTheDocument();
  });

  it('displays user profile icon when authenticated', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { 
      id: 1, 
      username: 'testuser',
      picture: 'test-image.jpg'
    };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const profileImage = screen.getByAltText('صورة الحساب');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'test-image.jpg');
  });

  it('displays default profile icon when no picture is available', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, username: 'testuser' };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Should render the profile link but without an image
    const profileLink = screen.getByRole('link', { name: '' }); // The profile link has no accessible name
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('calls logout when logout button is clicked', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, username: 'testuser' };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Get all buttons and find the logout button (the second one)
    const buttons = screen.getAllByRole('button');
    const logoutButton = buttons[1]; // The logout button is the second button
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('has correct navigation links for authenticated users', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 1, username: 'testuser' };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const homeLink = screen.getByRole('link', { name: 'الصفحة الرئيسية' });
    const dashboardLink = screen.getByRole('link', { name: 'لوحة التحكم' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('shows logs link for users with log permissions', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { 
      id: 1, 
      username: 'testuser',
      groups: [{
        permissions: [{ codename: 'view_logentry' }]
      }]
    };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const logsLink = screen.getByRole('link', { name: 'السجلات' });
    expect(logsLink).toBeInTheDocument();
    expect(logsLink).toHaveAttribute('href', '/logs');
  });

  it('does not show logs link for users without log permissions', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { 
      id: 1, 
      username: 'testuser',
      groups: [{
        permissions: [{ codename: 'other_permission' }]
      }]
    };

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    expect(screen.queryByRole('link', { name: 'السجلات' })).not.toBeInTheDocument();
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const menuButton = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(menuButton);

    // Menu should be visible (opacity-100 visible)
    const menu = menuButton.parentElement.querySelector('div[class*="opacity-100"]');
    expect(menu).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const menuButton = screen.getByLabelText('Toggle navigation menu');
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle navigation menu');
  });

  it('handles scroll state changes', async () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Simulate scroll event
    Object.defineProperty(window, 'scrollY', {
      value: 100,
      writable: true,
    });

    window.dispatchEvent(new Event('scroll'));

    // The navbar should still be rendered
    expect(screen.getByText('جامعة بورسعيد')).toBeInTheDocument();
  });
});