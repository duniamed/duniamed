import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function Layout({ children, showHeader = true, showFooter = true }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <Header />}
      <main className={`flex-1 pt-14 ${isMobile ? 'pb-20' : ''}`}>
        {children}
      </main>
      {isMobile && <MobileBottomNav />}
      {showFooter && !isMobile && <Footer />}
    </div>
  );
}
