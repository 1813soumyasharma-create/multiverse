import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, Crosshair as Target, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, query } from 'firebase/firestore';
import type { Subject } from './Dashboard';

interface MySubjectsProps {
  onSelectSubject: (subject: Subject) => void;
  setActiveTab: (tab: string) => void;
}

export default function MySubjects({ onSelectSubject, setActiveTab }: MySubjectsProps) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newTheme, setNewTheme] = useState<string>('Avengers');
  const [newExamDate, setNewExamDate] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/subjects`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    });
    return unsubscribe;
  }, [user]);

  const getIcon = (theme: string) => {
    if (theme === 'Avengers') return Shield;
    if (theme === 'Hunger Games') return Target;
    return Star;
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    const newSub = {
      title: newTitle,
      role: newRole || 'The Rookie',
      theme: newTheme,
      progress: 0,
      upcoming: 'No exams yet',
      examDate: newExamDate,
      streak: '0 days',
      color: newTheme === 'Avengers' ? 'from-red-900/40 to-red-500/10' 
           : newTheme === 'Hunger Games' ? 'from-orange-900/40 to-orange-500/10' 
           : 'from-purple-900/40 to-purple-500/10',
    };

    await addDoc(collection(db, `users/${user.uid}/subjects`), newSub);
    setIsModalOpen(false);
    setNewTitle(''); setNewRole(''); setNewExamDate('');
  };

  const handleCardClick = (sub: Subject) => {
    onSelectSubject(sub);
    setActiveTab('Subject Workspace');
  };

  const getDaysLeft = (dateString?: string) => {
    if (!dateString) return null;
    const exam = new Date(dateString).getTime();
    const now = new Date().getTime();
    return Math.ceil((exam - now) / (1000 * 3600 * 24));
  };

  return (
    <div className="p-8 overflow-y-auto h-full pb-24 relative">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">My Subjects</h2>
          <p className="text-gray-400 text-sm">Manage and organize your active study subjects.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus size={16} /> New Subject
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="glass p-12 text-center text-gray-400 rounded-2xl border border-dashed border-white/20">
          No subjects yet. Click "New Subject" to create one.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {subjects.map((sub, i) => {
          const Icon = getIcon(sub.theme);
          const daysLeft = getDaysLeft(sub.examDate);
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={sub.id} onClick={() => handleCardClick(sub)}
              className="glass-card p-5 relative overflow-hidden group cursor-pointer border border-white/5 hover:border-white/20 hover:scale-[1.02] transition-transform"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${sub.color} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">{sub.role}</p>
                    <h3 className="text-lg font-bold text-white leading-tight">{sub.title}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                    <Icon size={18} className="text-white/70" />
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Upcoming</p>
                    <p className={`text-sm font-bold ${daysLeft !== null && daysLeft <= 7 ? 'text-red-400' : 'text-white'} truncate max-w-[100px]`}>
                      {daysLeft !== null ? `${daysLeft} days left` : 'No date set'}
                    </p>
                  </div>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - sub.progress / 100)} className="text-secondary transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-xs font-bold text-white">{sub.progress}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass w-full max-w-md p-6 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
              <h3 className="text-xl font-bold text-white mb-6">Create New Subject</h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Subject Name</label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Operating Systems" className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" autoFocus /></div>
                <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Your Role (Optional)</label><input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Iron Strategist" className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Exam Date (Optional)</label><input type="date" value={newExamDate} onChange={(e) => setNewExamDate(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none [color-scheme:dark]" /></div>
                <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Universe Theme</label><select value={newTheme} onChange={(e) => setNewTheme(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none cursor-pointer"><option value="Avengers">Avengers</option><option value="Hunger Games">Hunger Games</option><option value="X-Men">X-Men</option></select></div>
                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl mt-4 transition-all">Initialize Subject</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
