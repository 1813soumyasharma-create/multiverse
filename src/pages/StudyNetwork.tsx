import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Send, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Post {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorCharacter: string;
  authorAvatar: string;
  authorUniverse: string;
  createdAt: any;
}

export default function StudyNetwork() {
  const { user } = useAuth();
  const { character, universe } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'global_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));
      setPosts(fetchedPosts);
    });
    return unsubscribe;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;
    
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'global_posts'), {
        text: newPost,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous Scholar',
        authorCharacter: character.name,
        authorAvatar: character.avatar,
        authorUniverse: universe,
        createdAt: serverTimestamp()
      });
      setNewPost('');
    } catch (error) {
      console.error("Error posting:", error);
    } finally {
      setIsPosting(false);
    }
  };

  // Helper to format @mentions
  const formatText = (text: string) => {
    const parts = text.split(/(@[A-Za-z0-9_]+)/g);
    return parts.map((part, i) => 
      part.startsWith('@') ? <span key={i} className="text-primary font-bold">{part}</span> : part
    );
  };

  return (
    <div className="p-8 h-full overflow-y-auto pb-24 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Globe className="text-primary" /> Study Network
        </h2>
        <p className="text-gray-400 text-sm">Broadcast your progress, share resources, and tag other scholars.</p>
      </div>

      {/* Create Post Box */}
      <div className="glass p-4 rounded-2xl mb-8 flex gap-4 items-start relative overflow-hidden">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-2xl flex-none shadow-lg shadow-primary/20">
          {character.avatar}
        </div>
        <form onSubmit={handlePost} className="flex-1">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share a study tip, ask a question, or tag someone with @name..."
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary/50 resize-none h-24 mb-3"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Posting as {character.name} ({universe})</span>
            <button 
              type="submit" 
              disabled={!newPost.trim() || isPosting}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isPosting ? 'Broadcasting...' : <><Send size={16} /> Transmit</>}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id} 
              className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-xl">
                  {post.authorAvatar}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{post.authorName}</h4>
                  <p className="text-[10px] text-primary uppercase tracking-widest font-bold">
                    {post.authorCharacter} · {post.authorUniverse}
                  </p>
                </div>
                <span className="ml-auto text-xs text-gray-500">
                  {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {formatText(post.text)}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No transmissions yet. Be the first to post!
          </div>
        )}
      </div>
    </div>
  );
}
