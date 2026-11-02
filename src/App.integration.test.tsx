// @vitest-environment jsdom
import { MantineProvider } from '@mantine/core';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import App from './App';
import { loadTipSplit } from './split-storage';

// jsdom does not implement the viewport API used by Mantine's hooks.
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
afterEach(cleanup);
afterAll(() => vi.unstubAllGlobals());

describe('React and testing-library compatibility', () => {
  it('renders the calculator and updates payouts and saved split through React events', () => {
    const { container } = render(
      <MantineProvider env="test">
        <App />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Tip Calculator', level: 1 })).toBeVisible();
    fireEvent.change(screen.getByLabelText('BOH %'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('FOH %'), { target: { value: '90' } });

    const group = container.querySelector('.group-panel') as HTMLElement;
    expect(within(group).getByText('Pool $2.00 | Hours 9')).toBeInTheDocument();
    expect(within(group).getByText('$0.65')).toBeInTheDocument();
    expect(within(group).getByText('$1.30')).toBeInTheDocument();
    expect(screen.queryByText('Split percentages do not equal 100%')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('FOH %'), { target: { value: '80' } });
    expect(screen.getByText('Split percentages do not equal 100%')).toBeVisible();
    fireEvent.change(screen.getByLabelText('FOH %'), { target: { value: '90' } });
    expect(loadTipSplit()).toEqual({ boh: 10, foh: 90 });

    const names = within(group).getAllByLabelText('Back of House employee name');
    fireEvent.change(names[0], { target: { value: 'Test Alex' } });
    expect(names[0]).toHaveValue('Test Alex');
    expect(within(group).getByLabelText('Back of House hours for Test Alex')).toHaveValue('3');

    fireEvent.click(within(group).getByRole('button', { name: 'Add row' }));
    expect(within(group).getAllByLabelText('Back of House employee name')).toHaveLength(3);
    fireEvent.click(within(group).getByRole('button', { name: 'Remove employee row' }));
    expect(within(group).getAllByLabelText('Back of House employee name')).toHaveLength(2);
  });
});
