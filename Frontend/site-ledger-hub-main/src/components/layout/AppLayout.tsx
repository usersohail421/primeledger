import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/authApi';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AppLayout = () => {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
  const logout = useAuthStore((s) => s.logout);
  const isMobile = useIsMobile();

  useEffect(() => {
    const verify = async () => {
      try {
        await authApi.getProfile();
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          window.location.replace('/login');
        }
      }
    };
    verify();
  }, [logout]);

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out",
          isMobile ? "ml-0" : (sidebarOpen ? "ml-[240px]" : "ml-[72px]")
        )}
      >
        <TopBar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
