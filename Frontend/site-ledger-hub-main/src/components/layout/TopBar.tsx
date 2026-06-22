import { Search, FolderKanban, FileText, MapPin, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { projectApi } from '@/api/projectApi';
import type { Project } from '@/types/project';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const TopBar = () => {
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar } = useUIStore();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isProjects = location.pathname.startsWith('/projects');
  const isBills = location.pathname.startsWith('/bills');
  const showSearch = isProjects || isBills;

  useEffect(() => {
    projectApi.getAll().then(setAllProjects).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = query.trim() 
    ? allProjects.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.location.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isProjects) {
        if (selectedIndex >= 0 && selectedIndex < filteredProjects.length) {
          handleSelectProject(filteredProjects[selectedIndex]);
        } else if (query.trim()) {
          navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
          setShowSuggestions(false);
          setQuery('');
        }
      } else if (isBills) {
        if (query.trim()) {
          navigate(`/bills?search=${encodeURIComponent(query.trim())}`);
          setShowSuggestions(false);
          setQuery('');
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredProjects.length - 1));
      setShowSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card relative z-50">
      <div className="flex items-center gap-3 flex-1 max-w-xl relative">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
        {showSearch ? (
          <div className="flex-1 flex items-center gap-3 relative" ref={dropdownRef}>
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleSearch}
              placeholder={isProjects ? "Search projects..." : "Search bills..."}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1 h-full py-4 min-w-0"
            />

            <AnimatePresence>
              {showSuggestions && query.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-[calc(100vw-2rem)] sm:w-full max-w-md mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
                >
                  {isProjects && filteredProjects.length > 0 && (
                    <>
                      <div className="p-2 border-b border-border bg-surface-elevated/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Projects</span>
                      </div>
                      <div className="p-1">
                        {filteredProjects.map((project, i) => (
                          <button
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            onMouseEnter={() => setSelectedIndex(i)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                              selectedIndex === i ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent/50'
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                              selectedIndex === i ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                            }`}>
                              <FolderKanban className="h-4 w-4" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-semibold truncate">{project.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {project.location}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="p-1 border-t border-border bg-accent/20">
                    {isProjects && (
                      <button
                        onClick={() => {
                          navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
                          setShowSuggestions(false);
                          setQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                      >
                        <FolderKanban className="h-4 w-4" />
                        <span className="text-xs">Search for "<span className="font-semibold text-foreground">{query}</span>" in Projects</span>
                      </button>
                    )}
                    {isBills && (
                      <button
                        onClick={() => {
                          navigate(`/bills?search=${encodeURIComponent(query.trim())}`);
                          setShowSuggestions(false);
                          setQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Search for "<span className="font-semibold text-foreground">{query}</span>" in Bills</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-2">

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block truncate max-w-[100px]">
            {user?.name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
