import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BillFormModal from '../BillFormModal';
import { billApi } from '@/api/billApi';

vi.mock('@/api/billApi');
vi.mock('react-hot-toast');

describe('BillFormModal', () => {
  const defaultProps = {
    projectId: '1',
    show: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  it('renders at least one item row by default', () => {
    render(<BillFormModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. Cement bags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
  });

  it('adds new item row when Add Item button clicked', () => {
    render(<BillFormModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getAllByPlaceholderText('e.g. Cement bags')).toHaveLength(2);
  });

  it('removes item row when delete button clicked', () => {
    render(<BillFormModal {...defaultProps} />);
    // Add one first
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getAllByPlaceholderText('e.g. Cement bags')).toHaveLength(2);
    
    const deleteButtons = screen.getAllByLabelText('Delete item');
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getAllByPlaceholderText('e.g. Cement bags')).toHaveLength(1);
  });

  it('shows validation error when item name is empty on submit', async () => {
    render(<BillFormModal {...defaultProps} />);
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /create bill/i }));
    
    // We mock toast in vitest setup or just assert the API was not called
    await waitFor(() => {
      expect(billApi.create).not.toHaveBeenCalled();
    });
  });

  it('shows validation error when item amount is zero or negative on submit', async () => {
    render(<BillFormModal {...defaultProps} />);
    fireEvent.change(screen.getAllByPlaceholderText('e.g. Cement bags')[0], { target: { value: 'Test Item' } });
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '-10' } });
    fireEvent.click(screen.getByRole('button', { name: /create bill/i }));
    
    await waitFor(() => {
      expect(billApi.create).not.toHaveBeenCalled();
    });
  });

  it('calculates and displays running total correctly when amounts entered', () => {
    render(<BillFormModal {...defaultProps} />);
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '1000' } });
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
  });

  it('total updates when item amount changes', () => {
    render(<BillFormModal {...defaultProps} />);
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '1000' } });
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '2000' } });
    expect(screen.getByText('₹2,000')).toBeInTheDocument();
  });

  it('total updates when item is deleted', () => {
    render(<BillFormModal {...defaultProps} />);
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    fireEvent.change(screen.getAllByPlaceholderText('0')[1], { target: { value: '2000' } });
    
    expect(screen.getByText('₹3,000')).toBeInTheDocument();
    
    const deleteButtons = screen.getAllByLabelText('Delete item');
    fireEvent.click(deleteButtons[1]); // remove the second item
    
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
  });
});
