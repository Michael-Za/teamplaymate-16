import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataManagementSection } from './DataManagementSection';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the framer-motion components
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

// Mock the contexts
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isHighContrast: false,
    toggleTheme: jest.fn(),
    toggleHighContrast: jest.fn()
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: jest.fn()
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('DataManagementSection', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <DataManagementSection />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    );
    
    expect(screen.getByText('Data Management')).toBeInTheDocument();
  });
});