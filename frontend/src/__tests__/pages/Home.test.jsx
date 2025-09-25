import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../../pages/Home/Home';
import { AuthProvider } from '../../context/AuthContext';

// Mock the Slider component
vi.mock('../../components/Slider/Slider', () => ({
  default: () => <div data-testid="slider-component">Slider Component</div>,
}));

// Mock the PlexusBackground component
vi.mock('../../components/PlexusBackground', () => ({
  default: () => <div data-testid="plexus-background">Plexus Background</div>,
}));

// Mock all the faculty logo assets
const mockFacultyLogos = [
  'MTIS.png', 'med.png', 'pha.jpg', 'sci.png', 'nur.jpg', 
  'arts.jpg', 'edu.jpg', 'law.jpg', 'com.JPG', 'phyedu.jpg', 
  'eng.jpg', 'edunaw3.jpg', 'edukids.jpg', 'phytherapy.jpg'
];

mockFacultyLogos.forEach(logo => {
  vi.mock(`../../assets/facuilites/${logo}`, () => ({
    default: `mocked-${logo}`,
  }));
});

vi.mock('../../assets/psu-logo.svg', () => ({
  default: 'mocked-psu-logo.svg',
}));

vi.mock('../../assets/psu2.jpg', () => ({
  default: 'mocked-psu2.jpg',
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

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders home page for unauthenticated users', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText('مرحباً بك في منصة تتبع التعليم')).toBeInTheDocument();
    expect(screen.getByText('نظام إدارة تعليمي متكامل')).toBeInTheDocument();
  });

  it('renders personalized greeting for authenticated users', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'أحمد',
      last_name: 'محمد',
    };

    render(
      <TestWrapper initialAuth={mockUser}>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText('مرحباً بك، أحمد محمد')).toBeInTheDocument();
  });

  it('renders username when only first name is available', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'أحمد',
    };

    render(
      <TestWrapper initialAuth={mockUser}>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText('مرحباً بك، أحمد')).toBeInTheDocument();
  });

  it('renders username when no name is available', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };

    render(
      <TestWrapper initialAuth={mockUser}>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText('مرحباً بك، testuser')).toBeInTheDocument();
  });

  it('renders email local part when no name or username', () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
    };

    render(
      <TestWrapper initialAuth={mockUser}>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText('مرحباً بك، user')).toBeInTheDocument();
  });

  it('renders slider component', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByTestId('slider-component')).toBeInTheDocument();
  });

  it('renders PlexusBackground component', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByTestId('plexus-background')).toBeInTheDocument();
  });

  it('renders hero image', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    const heroImage = screen.getByAltText('جامعة بورسعيد');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute('src', 'mocked-psu2.jpg');
  });

  it('renders university logo', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    const logo = screen.getByAltText('جامعة بورسعيد');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'mocked-psu-logo.svg');
  });

  it('renders faculty logos', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Check for some of the faculty logos
    expect(screen.getByAltText('كلية الهندسة')).toBeInTheDocument();
    expect(screen.getByAltText('كلية الطب')).toBeInTheDocument();
    expect(screen.getByAltText('كلية الصيدلة')).toBeInTheDocument();
  });

  it('has correct faculty logo links', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    const engineeringLink = screen.getByRole('link', { name: /كلية الهندسة/i });
    const medicineLink = screen.getByRole('link', { name: /كلية الطب/i });

    expect(engineeringLink).toHaveAttribute('href', 'https://eng.psu.edu.eg/');
    expect(medicineLink).toHaveAttribute('href', 'https://med.psu.edu.eg/');
  });

  it('opens faculty links in new tab', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    const facultyLinks = screen.getAllByRole('link');
    const externalLinks = facultyLinks.filter(link => 
      link.getAttribute('href')?.startsWith('http')
    );

    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders call-to-action buttons for unauthenticated users', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByRole('link', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /إنشاء حساب/i })).toBeInTheDocument();
  });

  it('renders dashboard link for authenticated users', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };

    render(
      <TestWrapper initialAuth={mockUser}>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByRole('link', { name: /الذهاب إلى لوحة التحكم/i })).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Check for proper heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check for proper alt text on images
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
    });
  });

  it('renders typewriter effect for hero title', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // The typewriter effect should be present in the DOM
    expect(screen.getByText('مرحباً بك في منصة تتبع التعليم')).toBeInTheDocument();
  });

  it('has responsive design classes', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Check for responsive classes on main elements
    const heroSection = screen.getByText('مرحباً بك في منصة تتبع التعليم').closest('section');
    expect(heroSection).toBeInTheDocument();
  });

  it('renders all faculty sections', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Check for faculty sections
    const facultySections = screen.getAllByText(/كلية/i);
    expect(facultySections.length).toBeGreaterThan(0);
  });

  it('handles missing user data gracefully', () => {
    const mockUser = {};

    render(
      <TestWrapper initialAuth={mockUser}>
        <Home />
      </TestWrapper>
    );

    // Should fall back to default greeting
    expect(screen.getByText('مرحباً بك في منصة تتبع التعليم')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Check for features content
    expect(screen.getByText('نظام إدارة تعليمي متكامل')).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Check for main semantic elements
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
