import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../../components/Footer';

// Mock the assets
vi.mock('../../assets/psu-logo.svg', () => ({
  default: 'mocked-logo.svg'
}));

const TestWrapper = ({ children, _initialPath = '/' }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  it('renders footer with all main sections', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    // Check if footer element exists
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check for university name
    expect(screen.getByText('جامعة بورسعيد')).toBeInTheDocument();
    expect(screen.getByText('Port Said University')).toBeInTheDocument();
    expect(screen.getByText('منصة تتبع تعليمي شاملة')).toBeInTheDocument();

    // Check for logo
    const logo = screen.getByAltText('جامعة بورسعيد');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'mocked-logo.svg');
  });

  it('renders quick links section', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    expect(screen.getByText('روابط سريعة')).toBeInTheDocument();
    expect(screen.getByText('حول الجامعة')).toBeInTheDocument();
    expect(screen.getByText('اتصل بنا')).toBeInTheDocument();
    expect(screen.getByText('مركز المساعدة')).toBeInTheDocument();
  });

  it('renders services section', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    expect(screen.getByText('الخدمات')).toBeInTheDocument();
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
    expect(screen.getByText('المميزات')).toBeInTheDocument();
    expect(screen.getByText('التسجيل')).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    // Check for social media icons
    const socialLinks = screen.getAllByRole('link');
    const socialLinkTitles = socialLinks
      .filter(link => link.getAttribute('title'))
      .map(link => link.getAttribute('title'));

    expect(socialLinkTitles).toContain('facebook-f');
    expect(socialLinkTitles).toContain('twitter');
    expect(socialLinkTitles).toContain('instagram');
    expect(socialLinkTitles).toContain('linkedin-in');
    expect(socialLinkTitles).toContain('youtube');
  });

  it('renders Google Maps iframe', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src');
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe).toHaveAttribute('allowfullscreen');
  });

  it('renders copyright notice', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    expect(screen.getByText('© 2025 جامعة بورسعيد. جميع الحقوق محفوظة.')).toBeInTheDocument();
  });

  it('has proper link navigation', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    // Check quick links
    const aboutLink = screen.getByRole('link', { name: 'حول الجامعة' });
    expect(aboutLink).toHaveAttribute('href', '/about');

    const contactLink = screen.getByRole('link', { name: 'اتصل بنا' });
    expect(contactLink).toHaveAttribute('href', '/contact');

    const helpLink = screen.getByRole('link', { name: 'مركز المساعدة' });
    expect(helpLink).toHaveAttribute('href', '/help');

    // Check service links
    const dashboardLink = screen.getByRole('link', { name: 'لوحة التحكم' });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const featuresLink = screen.getByRole('link', { name: 'المميزات' });
    expect(featuresLink).toHaveAttribute('href', '/features');

    const registerLink = screen.getByRole('link', { name: 'التسجيل' });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check if all social links have proper titles
    const socialLinks = screen.getAllByRole('link');
    socialLinks.forEach(link => {
      if (link.getAttribute('title')) {
        expect(link.getAttribute('title')).toBeTruthy();
      }
    });
  });

  it('applies correct CSS classes', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('!bg-gradient-to-r', '!from-slate-800', '!via-slate-700', '!to-slate-600');
  });

  it('renders all sections with proper structure', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    // Check that all main sections are present
    expect(screen.getByText('روابط سريعة')).toBeInTheDocument();
    expect(screen.getByText('الخدمات')).toBeInTheDocument();
    expect(screen.getByText('جامعة بورسعيد')).toBeInTheDocument();
    
    // Check that lists are properly structured
    const quickLinksSection = screen.getByText('روابط سريعة').closest('div');
    expect(quickLinksSection).toBeInTheDocument();
    
    const servicesSection = screen.getByText('الخدمات').closest('div');
    expect(servicesSection).toBeInTheDocument();
  });

  it('handles responsive design classes', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('max-sm:!py-6');
  });
});