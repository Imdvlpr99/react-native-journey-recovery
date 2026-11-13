import React from 'react';
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react';
import { it, expect, describe, beforeEach, beforeAll, vi } from 'vitest';
import { App } from '../../website/src/App';
import { parseHash } from '../../website/src/lib/router';
import { ALL_PAGES } from '../../website/src/content/docs';
import { searchPages } from '../../website/src/components/SearchDialog';

beforeAll(() => {
  // jsdom does not implement scrolling.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

function setHash(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('website routing', () => {
  it('parses home, docs, headings and legacy routes', () => {
    expect(parseHash('')).toEqual({ view: 'home' });
    expect(parseHash('#/')).toEqual({ view: 'home' });
    expect(parseHash('#/docs')).toEqual({ view: 'docs', pageId: null, heading: null });
    expect(parseHash('#/docs/quickstart#restore')).toEqual({ view: 'docs', pageId: 'quickstart', heading: 'restore' });
    expect(parseHash('#/architecture')).toMatchObject({ view: 'docs', pageId: 'architecture' });
    expect(parseHash('#/storage')).toMatchObject({ view: 'docs', pageId: 'storage-adapters' });
    expect(parseHash('#/docs/storage-mmkv')).toMatchObject({ pageId: 'storage-adapters' });
  });

  it('has unique page ids', () => {
    const ids = ALL_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('website app', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders the landing page by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Never make users start over/i })).toBeDefined();
    expect(screen.getAllByText(/npm install react-native-journey-recovery/i).length).toBeGreaterThan(0);
  });

  it('renders the first docs page for #/docs', () => {
    window.location.hash = '#/docs';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Introduction' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /The problem/i })).toBeDefined();
  });

  it('redirects #/architecture and #/storage to their docs pages', () => {
    window.location.hash = '#/architecture';
    const { unmount } = render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Architecture' })).toBeDefined();
    unmount();

    window.location.hash = '#/storage';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Storage adapters' })).toBeDefined();
  });

  it('renders every docs page without crashing', () => {
    const { unmount } = render(<App />);
    unmount();
    for (const page of ALL_PAGES) {
      window.location.hash = `#/docs/${page.id}`;
      const view = render(<App />);
      expect(screen.getByRole('heading', { level: 1, name: page.title })).toBeDefined();
      view.unmount();
    }
  });

  it('navigates from the header to the docs and between pages', () => {
    render(<App />);
    const mainNav = screen.getByRole('navigation', { name: 'Main' });
    fireEvent.click(within(mainNav).getByText('Docs'));
    setHash('#/docs/overview');
    expect(screen.getByRole('heading', { level: 1, name: 'Introduction' })).toBeDefined();

    setHash('#/docs/quickstart');
    expect(screen.getByRole('heading', { level: 1, name: 'Quickstart' })).toBeDefined();
    const current = screen
      .getAllByRole('link', { name: 'Quickstart' })
      .find((el) => el.getAttribute('aria-current') === 'page');
    expect(current).toBeDefined();
  });

  it('shows a not-found page for unknown ids', () => {
    window.location.hash = '#/docs/does-not-exist';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeDefined();
  });

  it('opens search with Ctrl+K and finds API pages', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByRole('combobox', { name: /search documentation/i });
    fireEvent.change(input, { target: { value: 'useRecovery' } });
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('website playground', () => {
  // The playground is lazy-loaded; warm the module (and react-native-web) once so tests don't race the import.
  beforeAll(async () => {
    await import('../../website/src/demo/Playground');
  }, 60000);

  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/playground';
  });

  it('runs the React Native app, survives a kill, and offers to resume', async () => {
    render(<App />);

    const name = await screen.findByLabelText('Full name', {}, { timeout: 5000 });
    fireEvent.change(name, { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText('Street'), { target: { value: '12 Analytical Way' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'London' } });

    // Debounced checkpoint lands in localStorage.
    await waitFor(() => expect(window.localStorage.getItem('@rn_journey:checkout')).toContain('London'), {
      timeout: 3000,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Kill app' }));
    expect(screen.queryByLabelText('Full name')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open app' }));
    expect(await screen.findByText('Pick up where you left off?')).toBeDefined();

    fireEvent.click(screen.getByText('Resume checkout'));
    await waitFor(() => expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('London'));
  }, 20000);

  it('reports corrupted storage as invalid', async () => {
    render(<App />);
    fireEvent.change(await screen.findByLabelText('Full name', {}, { timeout: 5000 }), { target: { value: 'Ada' } });
    await waitFor(() => expect(window.localStorage.getItem('@rn_journey:checkout')).toContain('Ada'), { timeout: 3000 });

    fireEvent.click(screen.getByRole('button', { name: /Corrupt the data/ }));
    expect(await screen.findByText("We couldn't restore your checkout", {}, { timeout: 3000 })).toBeDefined();
    expect(screen.getByText(/SNAPSHOT_CORRUPTED/)).toBeDefined();
  }, 20000);
});

describe('website search', () => {
  it('ranks exact title matches first', () => {
    expect(searchPages('useJourney')[0].id).toBe('use-journey');
    expect(searchPages('migration')[0].id).toBe('schema-migration');
  });

  it('matches keywords and requires every term', () => {
    expect(searchPages('mmkv').map((p) => p.id)).toContain('storage-adapters');
    expect(searchPages('mmkv zzzz')).toHaveLength(0);
  });

  it('suggests pages for an empty query', () => {
    expect(searchPages('').length).toBeGreaterThan(0);
  });
});
