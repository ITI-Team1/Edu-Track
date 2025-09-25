import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../pages/Dashboard/Dashboard';

// Mock the API services
vi.mock('../../services/userApi', () => ({
  fetchUserPermissions: vi.fn(),
}));

vi.mock('../../services/facultyApi', () => ({
  fetchFaculties: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: true,
  user: { 
    id: 1, 
    username: 'testuser', 
    email: 'test@example.com',
    groups: [{ id: 2, name: 'Student' }] // Student group to show some tabs
  },
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock all the lazy-loaded components
vi.mock('../../components/Schedule', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="schedule-component">
      Schedule Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/FacultyManage/FacultyManage', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="faculty-manage-component">
      Faculty Manage Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/Department/Department', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="department-component">
      Department Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/Hall/Hall', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="hall-component">
      Hall Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/courseMange/CoursesMange', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="courses-manage-component">
      Courses Manage Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/Lecture/Lecture', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="lecture-component">
      Lecture Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../components/Enrollment', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="enrollment-component">
      Enrollment Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../components/Courses', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="courses-component">
      Courses Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/AttendanceRecords/AttendanceRecords', () => ({
  default: ({ permissions, facultiesData }) => (
    <div data-testid="attendance-records-component">
      Attendance Records Component - Permissions: {permissions?.length || 0}, Faculties: {facultiesData?.length || 0}
    </div>
  ),
}));

vi.mock('../../pages/InstructorGrades/InstructorGrades', () => ({
  default: () => <div data-testid="instructor-grades-component">Instructor Grades Component</div>,
}));

vi.mock('../../pages/StudentDegrees/StudentDegree', () => ({
  default: () => <div data-testid="student-degree-component">Student Degree Component</div>,
}));

vi.mock('../../pages/ExamTable/ExamTable', () => ({
  default: () => <div data-testid="exam-table-component">Exam Table Component</div>,
}));

vi.mock('../../pages/Overview/Overview', () => ({
  default: () => <div data-testid="overview-component">Overview Component</div>,
}));

vi.mock('../../components/Spinner', () => ({
  default: ({ size, color }) => (
    <div data-testid="spinner" data-size={size} data-color={color}>
      Loading...
    </div>
  ),
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
      <MemoryRouter initialEntries={['/dashboard']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked functions
    const { fetchUserPermissions } = await import('../../services/userApi');
    const { fetchFaculties } = await import('../../services/facultyApi');
    
    // Set up default mock implementations
    fetchUserPermissions.mockResolvedValue([
      { codename: 'view_schedule' },
      { codename: 'view_faculty' },
    ]);
    fetchFaculties.mockResolvedValue([
      { id: 1, name: 'Faculty 1' },
      { id: 2, name: 'Faculty 2' },
    ]);
  });

  it('renders dashboard with overview tab by default', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while data is being fetched', async () => {
    // Get the mocked functions
    const { fetchUserPermissions } = await import('../../services/userApi');
    const { fetchFaculties } = await import('../../services/facultyApi');
    
    // Make the API calls take longer
    fetchUserPermissions.mockImplementation(() => new Promise(() => {}));
    fetchFaculties.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should show loading spinner initially
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    });

    // Click on a different tab (الجدول for students)
    const scheduleTab = screen.getByText('الجدول');
    fireEvent.click(scheduleTab);

    await waitFor(() => {
      expect(screen.getByTestId('schedule-component')).toBeInTheDocument();
    });
  });

  it('shows different tabs based on user permissions', async () => {
    // Update user to have faculty manager group (id: 5)
    mockAuthContext.user.groups = [{ id: 5, name: 'Faculty Manager' }];

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    });

    // Should show faculty management tab for faculty managers
    expect(screen.getByText('الكليات')).toBeInTheDocument();
  });

  it('renders lazy-loaded components with correct props', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    });

    // Click on schedule tab to trigger lazy loading
    const scheduleTab = screen.getByText('الجدول');
    fireEvent.click(scheduleTab);

    await waitFor(() => {
      expect(screen.getByTestId('schedule-component')).toBeInTheDocument();
    });

    // Check that the component received the correct props
    expect(screen.getByText(/Schedule Component - Permissions: 2, Faculties: 2/)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Get the mocked functions
    const { fetchUserPermissions } = await import('../../services/userApi');
    const { fetchFaculties } = await import('../../services/facultyApi');
    
    // Mock API to throw error but resolve quickly to avoid unhandled rejections
    fetchUserPermissions.mockImplementation(() => 
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('API Error')), 0);
      })
    );
    fetchFaculties.mockImplementation(() => 
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('API Error')), 0);
      })
    );

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should still render the dashboard even with API errors
    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('redirects to home if not authenticated', () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should redirect to home
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows correct tab content for each tab', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    });

    // Test different tabs available for students
    const tabs = [
      { name: 'الجدول', component: 'schedule-component' },
      { name: 'التسجيل الإكاديمي', component: 'courses-component' },
    ];

    for (const tab of tabs) {
      if (screen.queryByText(tab.name)) {
        fireEvent.click(screen.getByText(tab.name));
        
        await waitFor(() => {
          expect(screen.getByTestId(tab.component)).toBeInTheDocument();
        });
      }
    }
  });

  it('has proper accessibility attributes', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
    });

    // Check for proper navigation structure
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});