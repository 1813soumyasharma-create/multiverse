import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

export default function Header({ activeTab, toggleMobileMenu }: { activeTab: string, toggleMobileMenu: () => void }) {
  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-border/50 bg-panel/30 backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileMenu} className="md:hidden text-gray-400 hover:text-white">
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
          <span className="hover:text-white cursor-pointer">Multiverse</span>
          <span>/</span>
          <span className="text-white">{activeTab}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-black/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-64"
          />
        </div>
        <button className="relative text-gray-400 hover:text-white">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
