import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, describe, beforeEach } from 'vitest';
import { App } from '../../website/src/App';

describe('Website App Multi-View & Routing Test Suite', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders home overview view by default', () => {
    const { container } = render(<App />);
    expect(container.innerHTML).not.toBe('');
    expect(screen.getByText(/Deterministic state recovery/i)).toBeDefined();
    expect(screen.getByText(/How the engine works in 3 steps/i)).toBeDefined();
    expect(screen.getAllByText(/Promise FIFO Mutex/i).length).toBeGreaterThan(0);
  });

  it('renders docs view when hash is #/docs', () => {
    window.location.hash = '#/docs';
    render(<App />);
    expect(screen.getAllByText(/Overview/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Why Journey Recovery/i).length).toBeGreaterThan(0);
  });

  it('renders architecture view when hash is #/architecture', () => {
    window.location.hash = '#/architecture';
    render(<App />);
    expect(screen.getByText(/Recovery Pipeline & Mutex Queue/i)).toBeDefined();
  });

  it('renders storage view when hash is #/storage', () => {
    window.location.hash = '#/storage';
    render(<App />);
    expect(screen.getByText(/Storage Adapter Decision Matrix/i)).toBeDefined();
  });

  it('navigates cleanly between tabs when navbar buttons are clicked', () => {
    render(<App />);
    const archTab = screen.getByRole('button', { name: /^Architecture/i });
    fireEvent.click(archTab);
    expect(screen.getByText(/Recovery Pipeline & Mutex Queue/i)).toBeDefined();
    expect(window.location.hash).toBe('#/architecture');

    const storageTab = screen.getByRole('button', { name: /^Storage Matrix/i });
    fireEvent.click(storageTab);
    expect(screen.getByText(/Storage Adapter Decision Matrix/i)).toBeDefined();
    expect(window.location.hash).toBe('#/storage');
  });

  it('does not reset view when clicking doc links with #/docs/*', () => {
    window.location.hash = '#/docs';
    render(<App />);
    const quickstartLinks = screen.getAllByText(/Quickstart/i);
    fireEvent.click(quickstartLinks[0]);
    expect(screen.getAllByText(/Why Journey Recovery/i).length).toBeGreaterThan(0);
  });
});
