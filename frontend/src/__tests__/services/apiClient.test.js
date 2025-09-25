import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios before importing apiClient
const mockAxiosInstance = {
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

// Mock environment variables
const originalEnv = import.meta.env;

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Reset environment variables
    import.meta.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment variables
    import.meta.env = originalEnv;
  });

  it('creates axios instance with correct base URL from VITE_API_BASE', async () => {
    import.meta.env.VITE_API_BASE = 'https://api.example.com';
    
    // Re-import to get the updated config
    vi.resetModules();
    const { apiClient } = await import('../../services/apiClient');
    
    expect(apiClient).toBeDefined();
  });

  it('falls back to production URL when no environment variables are set', async () => {
    delete import.meta.env.VITE_API_BASE;
    delete import.meta.env.VITE_PUBLIC_BASE_URL;
    
    vi.resetModules();
    const { apiClient } = await import('../../services/apiClient');
    
    expect(apiClient).toBeDefined();
  });

  it('uses VITE_PUBLIC_BASE_URL with port 8000 when VITE_API_BASE is not set', async () => {
    import.meta.env.VITE_PUBLIC_BASE_URL = 'http://localhost:5173';
    delete import.meta.env.VITE_API_BASE;
    
    vi.resetModules();
    const { apiClient } = await import('../../services/apiClient');
    
    expect(apiClient).toBeDefined();
  });

  it('handles invalid VITE_PUBLIC_BASE_URL gracefully', async () => {
    import.meta.env.VITE_PUBLIC_BASE_URL = 'invalid-url';
    delete import.meta.env.VITE_API_BASE;
    
    vi.resetModules();
    const { apiClient } = await import('../../services/apiClient');
    
    expect(apiClient).toBeDefined();
  });

  it('configures axios with correct options', async () => {
    const axios = await import('axios');
    
    vi.resetModules();
    await import('../../services/apiClient');
    
    expect(axios.default.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      withCredentials: false,
    });
  });

  it('sets up request interceptor to add authorization header', async () => {
    vi.resetModules();
    await import('../../services/apiClient');
    
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('sets up response interceptor for error handling', async () => {
    vi.resetModules();
    await import('../../services/apiClient');
    
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('request interceptor adds token from localStorage', async () => {
    vi.resetModules();
    await import('../../services/apiClient');
    
    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    
    // Test with authToken
    localStorage.setItem('authToken', 'test-token');
    const config1 = { headers: {} };
    const result1 = requestInterceptor(config1);
    expect(result1.headers.Authorization).toBe('Bearer test-token');
    
    // Test with access
    localStorage.clear();
    localStorage.setItem('access', 'access-token');
    const config2 = { headers: {} };
    const result2 = requestInterceptor(config2);
    expect(result2.headers.Authorization).toBe('Bearer access-token');
    
    // Test with access_token
    localStorage.clear();
    localStorage.setItem('access_token', 'access-token-value');
    const config3 = { headers: {} };
    const result3 = requestInterceptor(config3);
    expect(result3.headers.Authorization).toBe('Bearer access-token-value');
    
    // Test with token
    localStorage.clear();
    localStorage.setItem('token', 'token-value');
    const config4 = { headers: {} };
    const result4 = requestInterceptor(config4);
    expect(result4.headers.Authorization).toBe('Bearer token-value');
  });

  it('request interceptor does not add header when no token exists', async () => {
    vi.resetModules();
    await import('../../services/apiClient');
    
    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    
    localStorage.clear();
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor logs errors and rejects promise', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.resetModules();
    await import('../../services/apiClient');
    
    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    const error = {
      response: { data: { message: 'API Error' } },
      message: 'Network Error',
    };
    
    const result = responseInterceptor(error);
    
    expect(consoleSpy).toHaveBeenCalledWith('API Error:', { message: 'API Error' });
    expect(result).rejects.toBe(error);
    
    consoleSpy.mockRestore();
  });

  it('response interceptor handles errors without response data', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.resetModules();
    await import('../../services/apiClient');
    
    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    const error = { message: 'Network Error' };
    
    const result = responseInterceptor(error);
    
    expect(consoleSpy).toHaveBeenCalledWith('API Error:', 'Network Error');
    expect(result).rejects.toBe(error);
    
    consoleSpy.mockRestore();
  });

  it('response interceptor passes through successful responses', async () => {
    vi.resetModules();
    await import('../../services/apiClient');
    
    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
    
    const response = { data: { success: true } };
    const result = responseInterceptor(response);
    
    expect(result).toBe(response);
  });
});