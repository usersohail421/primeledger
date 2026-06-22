import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import toast from 'react-hot-toast';

vi.mock('@/api/authApi');
vi.mock('react-hot-toast');

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LoginPage', () => {
  it('renders email and password fields and login button', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation error when email is empty and form submitted', async () => {
    renderWithRouter(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });
  });

  it('shows validation error when password is empty and form submitted', async () => {
    renderWithRouter(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderWithRouter(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });
  });

  it('calls login API with correct data when form is valid', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({ token: 'test-token', name: 'Test', email: 'test@test.com' });
    vi.mocked(authApi.getProfile).mockResolvedValueOnce({ id: 1, name: 'Test', email: 'test@test.com' } as any);
    renderWithRouter(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    });
  });

  it('shows error toast when API returns 401', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({ response: { status: 401 } });
    renderWithRouter(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Session expired. Please login again.');
    });
  });

  it('disables submit button while loading', async () => {
    // We can simulate a pending promise to check loading state
    let resolveLogin: any;
    vi.mocked(authApi.login).mockImplementation(() => new Promise((res) => { resolveLogin = res; }));
    
    renderWithRouter(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });
    
    resolveLogin({ token: 'test', name: 'Test', email: 'test@test.com' });
  });
});
