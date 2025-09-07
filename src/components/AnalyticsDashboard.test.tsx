import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { describe, it, expect } from 'vitest';

// Mock the dependencies
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
    }
  }
}));

jest.mock('../services/realAnalyticsService', () => ({
  realAnalyticsService: {
    getPlayerPerformance: jest.fn().mockResolvedValue([])
  }
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe('AnalyticsDashboard', () => {
  it('renders without crashing', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
  });
});