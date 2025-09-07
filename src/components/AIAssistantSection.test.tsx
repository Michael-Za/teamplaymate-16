import React from 'react';
import { render, screen } from '@testing-library/react';
import { AIAssistantSection } from './AIAssistantSection';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the framer-motion components
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

// Mock the useTheme hook
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isHighContrast: false,
    toggleTheme: jest.fn(),
    toggleHighContrast: jest.fn()
  })
}));

describe('AIAssistantSection', () => {
  it('renders without crashing', () => {
    render(
      <ThemeProvider>
        <AIAssistantSection />
      </ThemeProvider>
    );
    
    expect(screen.getByText('AI Captain Pro')).toBeInTheDocument();
    expect(screen.getByText('Advanced Football Analytics & Tactical Intelligence')).toBeInTheDocument();
  });
});