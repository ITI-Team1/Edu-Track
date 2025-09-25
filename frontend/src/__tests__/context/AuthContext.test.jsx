import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  default: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should provide initial loading state', async () => {
    apiService.isAuthenticated.mockReturnValue(false);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for the auth check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After auth check, loading should be false and user should be null
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should check authentication on mount when user is authenticated', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(apiService.isAuthenticated).toHaveBeenCalled();
    expect(apiService.getCurrentUser).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should handle authentication check failure', async () => {
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockRejectedValue(new Error('Auth failed'));
    apiService.logout.mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(apiService.logout).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should handle login successfully', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    const credentials = { username: 'testuser', password: 'password' };
    const loginResponse = { token: 'mock-token' };

    apiService.login.mockResolvedValue(loginResponse);
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(apiService.login).toHaveBeenCalledWith(credentials);
    expect(apiService.getCurrentUser).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle register successfully', async () => {
    const userData = { username: 'newuser', email: 'new@example.com', password: 'password' };
    const registerResponse = { message: 'User created successfully' };

    apiService.register.mockResolvedValue(registerResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.register(userData);
    });

    expect(apiService.register).toHaveBeenCalledWith(userData);
    expect(response).toEqual(registerResponse);
  });

  it('should handle logout', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial auth check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Perform logout
    await act(async () => {
      result.current.logout();
    });

    expect(apiService.logout).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(window.location.href).toBe('/');
  });

  it('should refresh user data', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    const updatedUser = { id: 1, username: 'updateduser' };

    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(updatedUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial auth check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);

    // Refresh user
    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(updatedUser);
  });

  it('should handle refresh user failure silently', async () => {
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.getCurrentUser.mockRejectedValue(new Error('Refresh failed'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial auth check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Refresh user should not throw
    await act(async () => {
      await result.current.refreshUser();
    });

    // User should remain unchanged
    expect(result.current.user).toBe(null);
  });
});
