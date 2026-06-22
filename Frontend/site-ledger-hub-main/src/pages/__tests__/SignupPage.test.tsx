import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SignupPage from '../SignupPage';
import { BrowserRouter } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import toast from 'react-hot-toast';

vi.mock('@/api/authApi');
vi.mock('react-hot-toast');

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('SignupPage', () => {
  it('renders name, email, and password fields', () => {
    renderWithRouter(<SignupPage />);
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows validation error when name is missing', async () => {
    renderWithRouter(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('shows validation error when email is invalid', async () => {
    renderWithRouter(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });
  });

  it('shows validation error when password less than 6 characters', async () => {
    renderWithRouter(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('calls register API with correct data and redirects on success', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({ token: 'test-token', name: 'John', email: 'test@test.com' });
    vi.mocked(authApi.getProfile).mockResolvedValueOnce({ id: 1, name: 'John', email: 'test@test.com' } as any);
    
    renderWithRouter(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({ name: 'John', email: 'test@test.com', password: 'password123' });
    });
  });

  it('shows error when email already exists (409 response)', async () => {
    vi.mocked(authApi.register).mockRejectedValueOnce({ response: { status: 409 } });
    
    renderWithRouter(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('This record already exists.');
    });
  });
});
