import { ReactNode } from 'react';
import { Sidebar } from './ModernSidebar';
import { Header } from './ModernHeader';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isExpanded, isHovered } = useSidebar();
  const shouldShow = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          shouldShow ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <Header />
        
        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
