import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Plus, X, StickyNote, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: any;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/notes`), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(fetchedNotes);
    });
    return unsubscribe;
  }, [user]);

  const handleOpenModal = (note?: Note) => {
    if (note) {
      setActiveNote(note);
      setTitle(note.title);
      setContent(note.content);
    } else {
      setActiveNote(null);
      setTitle('');
      setContent('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    if (activeNote) {
      // Update existing note
      await updateDoc(doc(db, `users/${user.uid}/notes`, activeNote.id), {
        title,
        content,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new note
      await addDoc(collection(db, `users/${user.uid}/notes`), {
        title,
        content,
        updatedAt: serverTimestamp()
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this note?')) return;
    await deleteDoc(doc(db, `users/${user.uid}/notes`, id));
    if (activeNote?.id === id) setIsModalOpen(false);
  };

  return (
    <div className="p-8 h-full overflow-y-auto pb-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">My Notes</h2>
          <p className="text-gray-400 text-sm">Write and organize your study thoughts securely in the cloud.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      {notes.length === 0 && (
        <div className="glass p-12 flex flex-col items-center justify-center text-gray-400 rounded-2xl">
          <StickyNote size={48} className="mb-4 opacity-50" />
          <p>No notes yet. Click "New Note" to capture your first idea.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.map((note, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={note.id}
            onClick={() => handleOpenModal(note)}
            className="glass-card p-5 cursor-pointer relative group flex flex-col h-64"
          >
            <h3 className="font-bold text-white mb-2 line-clamp-2">{note.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-6 whitespace-pre-wrap">{note.content}</p>
            
            <div className="mt-auto pt-4 flex justify-between items-center text-xs text-gray-500">
              <span>{note.updatedAt ? new Date(note.updatedAt.toDate()).toLocaleDateString() : 'Just now'}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-2xl p-6 relative flex flex-col h-[80vh]"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title..."
                className="w-full bg-transparent border-none text-2xl font-bold text-white focus:outline-none mb-4 placeholder-gray-500"
                autoFocus
              />
              
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your thoughts here..."
                className="w-full flex-1 bg-transparent border-none text-gray-300 focus:outline-none resize-none placeholder-gray-600 leading-relaxed"
              />
              
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                <button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-medium transition-all">
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
