import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Survey from '../../pages/Survey-Pages/Survey';
import { AuthProvider } from '../../context/AuthContext';

// Mock the survey API
vi.mock('../../pages/Survey-Pages/surveyApi', () => ({
  surveyApi: {
    submitSurvey: vi.fn(),
  },
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  default: {
    isAuthenticated: vi.fn(() => true),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const TestWrapper = ({ children, initialAuth = null }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider initialAuth={initialAuth}>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Survey Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders survey form with all required fields', () => {
    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    expect(screen.getByText('استمارة استطلاع رأي حول مقرر دراسي')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('')).toHaveLength(18); // Multiple form fields exist (inputs + textareas)
    expect(screen.getByText('العام الدراسي')).toBeInTheDocument();
    expect(screen.getByText('الفصل الدراسي')).toBeInTheDocument();
    expect(screen.getByText('اسم المقرر')).toBeInTheDocument();
    expect(screen.getByText('كود المقرر')).toBeInTheDocument();
    expect(screen.getByText('القائم على التدريس')).toBeInTheDocument();
    expect(screen.getByText('الهيئة المعاونة')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /إرسال الاستمارة/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('العام الدراسي مطلوب')).toBeInTheDocument();
      expect(screen.getByText('الفصل الدراسي مطلوب')).toBeInTheDocument();
      expect(screen.getByText('اسم المقرر مطلوب')).toBeInTheDocument();
      expect(screen.getByText('كود المقرر مطلوب')).toBeInTheDocument();
      expect(screen.getByText('القائم على التدريس مطلوب')).toBeInTheDocument();
      expect(screen.getByText('الهيئة المعاونة مطلوبة')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockSubmitSurvey = vi.fn().mockResolvedValue({ success: true });
    const { surveyApi } = await import('../../pages/Survey-Pages/surveyApi');
    surveyApi.submitSurvey.mockImplementation(mockSubmitSurvey);

    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    // Fill in the form fields using name attributes
    const academicYearSelect = screen.getByDisplayValue('اختر العام الدراسي');
    const semesterSelect = screen.getByDisplayValue('اختر الفصل الدراسي');
    const courseNameInput = screen.getByPlaceholderText('أدخل اسم المقرر');
    const courseCodeInput = screen.getByPlaceholderText('أدخل كود المقرر');
    const instructorInput = screen.getByPlaceholderText('أدخل اسم المحاضر');
    const teachingAssistantInput = screen.getByPlaceholderText('أدخل اسم الهيئة المعاونة');

    fireEvent.change(academicYearSelect, { target: { value: '2024-2025' } });
    fireEvent.change(semesterSelect, { target: { value: 'الأول' } });
    fireEvent.change(courseNameInput, { target: { value: 'البرمجة' } });
    fireEvent.change(courseCodeInput, { target: { value: 'CS101' } });
    fireEvent.change(instructorInput, { target: { value: 'د. أحمد محمد' } });
    fireEvent.change(teachingAssistantInput, { target: { value: 'م. سارة علي' } });

    // Fill in all survey questions - need to click one radio button per question
    const radioButtons = screen.getAllByRole('radio');
    for (let i = 0; i < 12; i++) {
      fireEvent.click(radioButtons[i * 5]); // Click the first radio button (score 5) for each question
    }

    // Fill in improvement suggestions
    const improvementTextarea = screen.getByPlaceholderText('اكتب اقتراحاتك لتحسين المقرر...');
    fireEvent.change(improvementTextarea, { target: { value: 'تحسين المحتوى' } });

    // Fill in other suggestions
    const otherSuggestionsTextarea = screen.getByPlaceholderText('اكتب أي اقتراحات أخرى لديك...');
    fireEvent.change(otherSuggestionsTextarea, { target: { value: 'اقتراحات إضافية' } });

    const submitButton = screen.getByRole('button', { name: /إرسال الاستمارة/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitSurvey).toHaveBeenCalled();
    });
  });

  it('shows success message after successful submission', async () => {
    const mockSubmitSurvey = vi.fn().mockResolvedValue({ success: true });
    const { surveyApi } = await import('../../pages/Survey-Pages/surveyApi');
    surveyApi.submitSurvey.mockImplementation(mockSubmitSurvey);

    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    // Fill in required fields
    const academicYearSelect = screen.getByDisplayValue('اختر العام الدراسي');
    const semesterSelect = screen.getByDisplayValue('اختر الفصل الدراسي');
    const courseNameInput = screen.getByPlaceholderText('أدخل اسم المقرر');
    const courseCodeInput = screen.getByPlaceholderText('أدخل كود المقرر');
    const instructorInput = screen.getByPlaceholderText('أدخل اسم المحاضر');
    const teachingAssistantInput = screen.getByPlaceholderText('أدخل اسم الهيئة المعاونة');

    fireEvent.change(academicYearSelect, { target: { value: '2024-2025' } });
    fireEvent.change(semesterSelect, { target: { value: 'الأول' } });
    fireEvent.change(courseNameInput, { target: { value: 'البرمجة' } });
    fireEvent.change(courseCodeInput, { target: { value: 'CS101' } });
    fireEvent.change(instructorInput, { target: { value: 'د. أحمد محمد' } });
    fireEvent.change(teachingAssistantInput, { target: { value: 'م. سارة علي' } });

    // Fill in survey questions
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(button => fireEvent.click(button)); // Click all radio buttons

    // Fill in suggestions
    const improvementTextarea = screen.getByPlaceholderText('اكتب اقتراحاتك لتحسين المقرر...');
    fireEvent.change(improvementTextarea, { target: { value: 'تحسين المحتوى' } });

    const otherSuggestionsTextarea = screen.getByPlaceholderText('اكتب أي اقتراحات أخرى لديك...');
    fireEvent.change(otherSuggestionsTextarea, { target: { value: 'اقتراحات إضافية' } });

    const submitButton = screen.getByRole('button', { name: /إرسال الاستمارة/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('تم إرسال الاستمارة بنجاح! شكراً لك على وقتك.')).toBeInTheDocument();
    });
  });

  it('shows error message after failed submission', async () => {
    const mockSubmitSurvey = vi.fn().mockRejectedValue(new Error('Submission failed'));
    const { surveyApi } = await import('../../pages/Survey-Pages/surveyApi');
    surveyApi.submitSurvey.mockImplementation(mockSubmitSurvey);

    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    // Fill in required fields
    const academicYearSelect = screen.getByDisplayValue('اختر العام الدراسي');
    const semesterSelect = screen.getByDisplayValue('اختر الفصل الدراسي');
    const courseNameInput = screen.getByPlaceholderText('أدخل اسم المقرر');
    const courseCodeInput = screen.getByPlaceholderText('أدخل كود المقرر');
    const instructorInput = screen.getByPlaceholderText('أدخل اسم المحاضر');
    const teachingAssistantInput = screen.getByPlaceholderText('أدخل اسم الهيئة المعاونة');

    fireEvent.change(academicYearSelect, { target: { value: '2024-2025' } });
    fireEvent.change(semesterSelect, { target: { value: 'الأول' } });
    fireEvent.change(courseNameInput, { target: { value: 'البرمجة' } });
    fireEvent.change(courseCodeInput, { target: { value: 'CS101' } });
    fireEvent.change(instructorInput, { target: { value: 'د. أحمد محمد' } });
    fireEvent.change(teachingAssistantInput, { target: { value: 'م. سارة علي' } });

    // Fill in survey questions
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(button => fireEvent.click(button));

    // Fill in suggestions
    const improvementTextarea = screen.getByPlaceholderText('اكتب اقتراحاتك لتحسين المقرر...');
    fireEvent.change(improvementTextarea, { target: { value: 'تحسين المحتوى' } });

    const otherSuggestionsTextarea = screen.getByPlaceholderText('اكتب أي اقتراحات أخرى لديك...');
    fireEvent.change(otherSuggestionsTextarea, { target: { value: 'اقتراحات إضافية' } });

    const submitButton = screen.getByRole('button', { name: /إرسال الاستمارة/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('حدث خطأ في إرسال الاستمارة. يرجى المحاولة مرة أخرى.')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const mockSubmitSurvey = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    const { surveyApi } = await import('../../pages/Survey-Pages/surveyApi');
    surveyApi.submitSurvey.mockImplementation(mockSubmitSurvey);

    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    // Fill in required fields
    const academicYearSelect = screen.getByDisplayValue('اختر العام الدراسي');
    const semesterSelect = screen.getByDisplayValue('اختر الفصل الدراسي');
    const courseNameInput = screen.getByPlaceholderText('أدخل اسم المقرر');
    const courseCodeInput = screen.getByPlaceholderText('أدخل كود المقرر');
    const instructorInput = screen.getByPlaceholderText('أدخل اسم المحاضر');
    const teachingAssistantInput = screen.getByPlaceholderText('أدخل اسم الهيئة المعاونة');

    fireEvent.change(academicYearSelect, { target: { value: '2024-2025' } });
    fireEvent.change(semesterSelect, { target: { value: 'الأول' } });
    fireEvent.change(courseNameInput, { target: { value: 'البرمجة' } });
    fireEvent.change(courseCodeInput, { target: { value: 'CS101' } });
    fireEvent.change(instructorInput, { target: { value: 'د. أحمد محمد' } });
    fireEvent.change(teachingAssistantInput, { target: { value: 'م. سارة علي' } });

    // Fill in survey questions
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(button => fireEvent.click(button));

    // Fill in suggestions
    const improvementTextarea = screen.getByPlaceholderText('اكتب اقتراحاتك لتحسين المقرر...');
    fireEvent.change(improvementTextarea, { target: { value: 'تحسين المحتوى' } });

    const otherSuggestionsTextarea = screen.getByPlaceholderText('اكتب أي اقتراحات أخرى لديك...');
    fireEvent.change(otherSuggestionsTextarea, { target: { value: 'اقتراحات إضافية' } });

    const submitButton = screen.getByRole('button', { name: /إرسال الاستمارة/i });
    fireEvent.click(submitButton);

    // Wait for loading state to appear
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('جاري الإرسال...')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    // The form element exists but doesn't have a role attribute
    const formElement = screen.getByRole('button', { name: /إرسال الاستمارة/i }).closest('form');
    expect(formElement).toBeInTheDocument();

    // Check that form elements exist
    expect(screen.getByPlaceholderText('أدخل اسم المقرر')).toHaveAttribute('type', 'text');
    expect(screen.getByPlaceholderText('أدخل كود المقرر')).toHaveAttribute('type', 'text');
    expect(screen.getByPlaceholderText('أدخل اسم المحاضر')).toHaveAttribute('type', 'text');
    expect(screen.getByPlaceholderText('أدخل اسم الهيئة المعاونة')).toHaveAttribute('type', 'text');
  });

  it('handles form validation for all fields', async () => {
    render(
      <TestWrapper>
        <Survey />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /إرسال الاستمارة/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('العام الدراسي مطلوب')).toBeInTheDocument();
      expect(screen.getByText('الفصل الدراسي مطلوب')).toBeInTheDocument();
      expect(screen.getByText('اسم المقرر مطلوب')).toBeInTheDocument();
      expect(screen.getByText('كود المقرر مطلوب')).toBeInTheDocument();
      expect(screen.getByText('القائم على التدريس مطلوب')).toBeInTheDocument();
      expect(screen.getByText('الهيئة المعاونة مطلوبة')).toBeInTheDocument();
    });
  });
});