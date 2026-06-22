import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, MapPin, Loader2, FileText } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import ProjectCard from '@/components/projects/ProjectCard';
import toast from 'react-hot-toast';
import { projectApi } from '@/api/projectApi';
import { analyticsApi } from '@/api/analyticsApi';
import type { Project, ProjectStatus, CreateProjectRequest } from '@/types/project';
import { getErrorMessage } from '@/utils/errorHandler';
import { format } from 'date-fns';

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summaries, setSummaries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateProjectRequest>({
    name: '',
    location: '',
    description: '',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll(statusFilter ? { status: statusFilter } : undefined);
      setProjects(data);
      
      if (data.length > 0) {
        // Fetch summaries for accurate bill counts (catch errors to prevent breaking the whole page)
        const summaryPromises = data.map(p => analyticsApi.getSummary(String(p.id)).catch(() => null));
        const results = await Promise.all(summaryPromises);
        const newSummaries: Record<string, number> = {};
        data.forEach((p, i) => {
          if (results[i]) {
            newSummaries[p.id] = results[i]!.totalBillCount;
          }
        });
        setSummaries(newSummaries);
      } else {
        setSummaries({});
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) setSearch(q);
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    setSearchParams(params, { replace: true });
  };

  const filtered = projects.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    if (!form.name.trim() || !form.location.trim()) {
      toast.error('Name and Location are required.');
      return;
    }
    try {
      setCreating(true);
      await projectApi.create(form);
      toast.success('Project created!');
      setShowCreate(false);
      setForm({ name: '', location: '', description: '' });
      fetchProjects();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} total projects</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
            className="w-full sm:w-auto bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors duration-200 active:scale-[0.98] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No projects found" description="Try adjusting your search or filters, or create your first project." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProjectCard 
                project={project} 
                billCount={summaries[project.id] ?? 0}
                onView={() => window.location.href = `/projects/${project.id}`} 
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="text-sm font-medium text-primary mb-1.5 block">Project Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              placeholder="e.g. Sunrise Towers"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-primary mb-1.5 block">Location *</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              placeholder="City, State"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-primary mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-none"
              placeholder="Optional project description"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:border-primary transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
