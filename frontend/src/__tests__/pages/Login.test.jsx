import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../../pages/Login/Login';

// Mock the image asset
vi.mock('../../assets/login.jpeg', () => ({
  default: 'mocked-login-image.jpeg',
}));

// Mock PlexusBackground component
vi.mock('../../components/PlexusBackground', () => ({
  default: () => <div data-testid="plexus-background">Plexus Background</div>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { search: '' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock AuthContext
const mockLogin = vi.fn();
const mockAuthContext = {
  login: mockLogin,
  user: null,
  isAuthenticated: false,
  loading: false,
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

const TestWrapper = ({ children, initialRoute = '/login' }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
  });

  it('renders login form with all required elements', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText('مرحباً بعودتك')).toBeInTheDocument();
    expect(screen.getByText('سجل دخولك إلى حساب جامعة بورسعيد')).toBeInTheDocument();
    expect(screen.getByLabelText(/اسم المستخدم/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
  });

  it('renders login image', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const universityImage = screen.getByAltText('Port Said University');
    expect(universityImage).toBeInTheDocument();
    expect(universityImage).toHaveAttribute('src', 'mocked-login-image.jpeg');
  });

  it('renders PlexusBackground component', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByTestId('plexus-background')).toBeInTheDocument();
  });

  it('updates form data when inputs change', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('handles successful login', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('handles login error', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('redirects to next parameter after successful login', async () => {
    mockLogin.mockResolvedValue({ success: true });
    mockLocation.search = '?next=/dashboard';

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('redirects to home after successful login when no next parameter', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('has link to forgot password page', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const forgotPasswordLink = screen.getByRole('link', { name: /نسيت كلمة المرور؟/i });
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  it('has proper form accessibility', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const form = screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form');
    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);

    expect(form).toBeInTheDocument();
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});