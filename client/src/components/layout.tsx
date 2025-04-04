import { useState, ReactNode } from "react";
import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import MobileNav from "@/components/ui/mobile-nav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - hidden on mobile unless menu is open */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block fixed md:relative z-20 md:z-auto inset-0 md:inset-auto`}>
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        {children}
        <MobileNav />
      </main>
    </div>
  );
};

export default Layout;
