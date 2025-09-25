import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children, initialAuth = null, queryClient = null }) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient || defaultQueryClient}>
      <BrowserRouter>
        <AuthProvider initialAuth={initialAuth}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui, options = {}) => {
  const { initialAuth, queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialAuth={initialAuth} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Mock user data for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  level: 1,
  is_active: true,
};

export const mockAdminUser = {
  id: 2,
  username: 'admin',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  level: 1,
  is_active: true,
};

export const mockStudentUser = {
  id: 3,
  username: 'student',
  email: 'student@example.com',
  first_name: 'Student',
  last_name: 'User',
  level: 3,
  is_active: true,
};

// Mock API responses
export const mockApiResponses = {
  faculties: [
    { id: 1, name: 'كلية الهندسة', name_en: 'Engineering' },
    { id: 2, name: 'كلية الطب', name_en: 'Medicine' },
  ],
  courses: [
    { id: 1, name: 'رياضيات', name_en: 'Mathematics', faculty: 1 },
    { id: 2, name: 'فيزياء', name_en: 'Physics', faculty: 1 },
  ],
  lectures: [
    { id: 1, course: 1, day: 'Monday', start_time: '09:00', end_time: '10:00' },
    { id: 2, course: 2, day: 'Tuesday', start_time: '11:00', end_time: '12:00' },
  ],
  users: [
    { id: 1, username: 'user1', email: 'user1@example.com', first_name: 'User', last_name: 'One' },
    { id: 2, username: 'user2', email: 'user2@example.com', first_name: 'User', last_name: 'Two' },
  ],
};

// Helper functions
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

export const createMockQueryClient = (overrides = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        ...overrides.queries,
      },
      mutations: {
        retry: false,
        ...overrides.mutations,
      },
    },
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
