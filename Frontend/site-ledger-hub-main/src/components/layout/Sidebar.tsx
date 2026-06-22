import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/bills', label: 'Bills', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const logout = useAuthStore((s) => s.logout);
  const isMobile = useIsMobile();

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isMobile ? 240 : (sidebarOpen ? 240 : 72),
        x: isMobile && !sidebarOpen ? -240 : 0,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-border bg-sidebar shadow-xl lg:shadow-none",
        isMobile ? "w-[240px]" : ""
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <img src="/logo.png" alt="PrimeLedger Logo" className="h-8 w-8 shrink-0 object-contain" />
        <AnimatePresence mode="wait">
          {(sidebarOpen || isMobile) && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 text-lg font-bold text-foreground overflow-hidden whitespace-nowrap"
            >
              PrimeLedger
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : '')} />
              <AnimatePresence mode="wait">
                {(sidebarOpen || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-border space-y-1">
        <button
          onClick={() => {
            logout();
            handleLinkClick();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence mode="wait">
            {(sidebarOpen || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors duration-200"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
