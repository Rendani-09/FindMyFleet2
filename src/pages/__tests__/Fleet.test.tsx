import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Fleet from '../Fleet';
import { MemoryRouter } from 'react-router-dom';

// Mock the supabase module used by Fleet
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: async () => ({ data: [], error: null }) }),
  },
}));


describe('Fleet page', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Fleet />
      </MemoryRouter>
    );

    // The Fleet page has a title 'Fleet' in the CardTitle in the component
    expect(screen.getByText(/Fleet/i)).toBeTruthy();
  });
});
