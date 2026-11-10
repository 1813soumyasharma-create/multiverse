import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard, { type Subject } from './pages/Dashboard';
import MySubjects from './pages/MySubjects';
import SubjectWorkspace from './pages/SubjectWorkspace';
import Customization from './pages/Customization';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import StudyNetwork from './pages/StudyNetwork';
import Flashcards from './pages/Flashcards';
import LoginScreen from './components/auth/LoginScreen';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen w-full text-gray-200 transition-colors duration-500 relative z-0 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header activeTab={activeTab} toggleMobileMenu={() => setIsMobileOpen(true)} />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {activeTab === 'Dashboard' && (
            <Dashboard onSelectSubject={setSelectedSubject} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'My Subjects' && (
            <MySubjects onSelectSubject={setSelectedSubject} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'Subject Workspace' && (
            <SubjectWorkspace subject={selectedSubject} onBack={() => setActiveTab('My Subjects')} />
          )}
          {activeTab === 'Customization' && <Customization />}
          {activeTab === 'My Notes' && <Notes />}
          {activeTab === 'Analytics' && <Analytics />}
          {activeTab === 'Study Network' && <StudyNetwork />}
          {activeTab === 'Flashcards' && <Flashcards />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
