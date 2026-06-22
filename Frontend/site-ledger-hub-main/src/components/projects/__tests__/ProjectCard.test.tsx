import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectCard from '../ProjectCard';
import type { Project } from '@/types/project';

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  location: 'Test Location',
  description: 'Test Description',
  status: 'ACTIVE',
  createdAt: '2025-05-18T10:00:00Z',
  updatedAt: '2025-05-18T10:00:00Z',
};

describe('ProjectCard', () => {
  it('renders project details correctly', () => {
    render(<ProjectCard project={mockProject} billCount={5} onView={() => {}} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('renders correct status badge color for ACTIVE status', () => {
    render(<ProjectCard project={mockProject} billCount={5} onView={() => {}} />);
    const badge = screen.getByText(/active/i);
    expect(badge).toHaveClass('bg-success/10');
  });

  it('renders correct status badge color for ON_HOLD status', () => {
    render(<ProjectCard project={{ ...mockProject, status: 'ON_HOLD' }} billCount={5} onView={() => {}} />);
    const badge = screen.getByText(/on hold/i);
    expect(badge).toHaveClass('bg-warning/10');
  });

  it('renders correct status badge color for COMPLETED status', () => {
    render(<ProjectCard project={{ ...mockProject, status: 'COMPLETED' }} billCount={5} onView={() => {}} />);
    const badge = screen.getByText(/completed/i);
    expect(badge).toHaveClass('bg-info/10');
  });

  it('renders correct status badge color for ARCHIVED status', () => {
    render(<ProjectCard project={{ ...mockProject, status: 'ARCHIVED' }} billCount={5} onView={() => {}} />);
    const badge = screen.getByText(/archived/i);
    expect(badge).toHaveClass('bg-muted-foreground/10');
  });

  it('calls onView callback when View Project button clicked', () => {
    const onViewMock = vi.fn();
    render(<ProjectCard project={mockProject} billCount={5} onView={onViewMock} />);
    fireEvent.click(screen.getByRole('button', { name: /view project/i }));
    expect(onViewMock).toHaveBeenCalledTimes(1);
  });
});
