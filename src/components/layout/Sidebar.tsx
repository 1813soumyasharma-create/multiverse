import React from 'react';
import { LayoutDashboard, BookOpen, FileText, Users, Settings, Globe, StickyNote, BrainCircuit, BarChart3, X } from 'lucide-react';
import { useTheme, type Universe } from '../../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { universe, setUniverse, character } = useTheme();

  // REMOVED Document Vault
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: BookOpen, label: 'My Subjects' },
    { icon: StickyNote, label: 'My Notes' },
    { icon: BrainCircuit, label: 'Flashcards' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: Users, label: 'Study Network' },
    { icon: Settings, label: 'Customization' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`fixed md:sticky top-0 h-screen w-64 border-r border-border flex flex-col bg-panel/95 md:bg-panel/50 backdrop-blur-xl transition-transform duration-300 z-50 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-black shadow-lg shadow-primary/20">
              M
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">MULTIVERSE</h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">Study. Excel.</p>
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 mb-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
            <Globe size={12} /> Active Universe
          </label>
          <select 
            value={universe}
            onChange={(e) => setUniverse(e.target.value as Universe)}
            className="w-full bg-black/40 border border-border text-white text-sm rounded-lg p-2 outline-none focus:border-primary cursor-pointer"
          >
            <option value="Avengers">Avengers</option>
            <option value="Hunger Games">Hunger Games</option>
            <option value="X-Men">X-Men</option>
          </select>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setActiveTab(item.label);
                setIsMobileOpen(false); // Close on mobile after click
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.label 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border bg-black/20">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary border-2 border-panel flex items-center justify-center text-xl">
              {character.avatar}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{character.name}</p>
              <p className="text-[10px] text-primary uppercase tracking-wider font-bold truncate">{character.title}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
