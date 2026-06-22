import { MapPin, FileText } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  billCount: number;
  onView: () => void;
}

export default function ProjectCard({ project, billCount, onView }: ProjectCardProps) {
  return (
    <div className="block bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
        <MapPin className="h-3.5 w-3.5" /> {project.location}
      </div>
      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
      )}
      <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 mb-4">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" /> {billCount} bills
        </span>
        <span>{format(new Date(project.createdAt), 'dd MMM yyyy')}</span>
      </div>
      <button 
        onClick={onView}
        className="w-full text-center bg-secondary text-secondary-foreground font-medium py-2 rounded-lg hover:bg-secondary/80 transition-colors"
      >
        View Project
      </button>
    </div>
  );
}
