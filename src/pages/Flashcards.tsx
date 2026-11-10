import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, RotateCw, Trash2, ArrowLeft, ArrowRight, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject: string;
  unit: string;
}

export default function Flashcards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // AI Generation State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState('5');

  // Study Mode State
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const apiKey = localStorage.getItem('gemini-key');

  useEffect(() => {
    if (!user) return;
    const q = collection(db, `users/${user.uid}/flashcards`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard)));
    });
    return unsubscribe;
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim() || !user) return;
    await addDoc(collection(db, `users/${user.uid}/flashcards`), {
      question: newQ, answer: newA, subject: newSub || 'General', unit: newUnit || 'General'
    });
    setNewQ(''); setNewA(''); setNewSub(''); setNewUnit(''); setIsAdding(false);
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim() || !apiKey || !user) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate exactly ${aiCount} flashcards about "${aiTopic}". Return ONLY a valid JSON array of objects with keys "question" and "answer". Do not include markdown formatting or backticks.`;
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const text = response.text || '[]';
      // Clean up any potential markdown formatting from the AI
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      for (const card of parsed) {
        await addDoc(collection(db, `users/${user.uid}/flashcards`), {
          question: card.question, answer: card.answer, subject: 'AI Generated', unit: aiTopic
        });
      }
      setAiTopic('');
    } catch (err) {
      console.error("AI Gen failed", err);
      alert("Failed to generate cards. Check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteCard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm('Delete this flashcard?')) return;
    await deleteDoc(doc(db, `users/${user.uid}/flashcards`, id));
  };

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 150); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 150); };

  // Grouping Logic
  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.subject]) acc[card.subject] = {};
    if (!acc[card.subject][card.unit]) acc[card.subject][card.unit] = [];
    acc[card.subject][card.unit].push(card);
    return acc;
  }, {} as Record<string, Record<string, Flashcard[]>>);

  if (studyMode && cards.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-bg p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-primary),0.1)_0,transparent_100%)]"></div>
        <button onClick={() => setStudyMode(false)} className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /> Exit Study Mode</button>
        <div className="text-gray-400 mb-6 font-medium tracking-widest uppercase">Card {currentIndex + 1} of {cards.length}</div>
        
        <div className="relative w-full max-w-2xl h-96 cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div className="w-full h-full relative preserve-3d" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}>
            <div className="absolute w-full h-full backface-hidden glass flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-white/10 shadow-2xl">
              <span className="text-sm text-primary font-bold uppercase tracking-widest mb-4">Question</span>
              <h2 className="text-3xl font-bold text-white leading-tight">{cards[currentIndex].question}</h2>
              <span className="absolute bottom-6 text-xs text-gray-500 flex items-center gap-2"><RotateCw size={12}/> Click to flip</span>
            </div>
            <div className="absolute w-full h-full backface-hidden glass flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-white/10 shadow-2xl" style={{ transform: "rotateY(180deg)" }}>
              <span className="text-sm text-green-400 font-bold uppercase tracking-widest mb-4">Answer</span>
              <h2 className="text-2xl text-gray-200 leading-relaxed">{cards[currentIndex].answer}</h2>
            </div>
          </motion.div>
        </div>
        <div className="flex gap-4 mt-10">
          <button onClick={prevCard} className="p-4 glass rounded-full hover:bg-white/10 transition-all text-white"><ArrowLeft size={24} /></button>
          <button onClick={nextCard} className="p-4 glass rounded-full hover:bg-white/10 transition-all text-white"><ArrowRight size={24} /></button>
        </div>
        <style>{`.perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; }`}</style>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto pb-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Flashcards</h2>
          <p className="text-gray-400 text-sm">Active recall organized by subject and unit.</p>
        </div>
        <div className="flex gap-3">
          {cards.length > 0 && (
            <button onClick={() => { setCurrentIndex(0); setIsFlipped(false); setStudyMode(true); }} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20 flex items-center gap-2">
              <BrainCircuit size={16} /> Study Mode
            </button>
          )}
          <button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={16} /> New Card
          </button>
        </div>
      </div>

      {Object.keys(groupedCards).length === 0 ? (
        <div className="glass p-12 flex flex-col items-center justify-center text-gray-400 rounded-2xl">
          <BrainCircuit size={48} className="mb-4 opacity-50" />
          <p>No flashcards yet. Create one manually or generate them with AI!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedCards).map(([subject, units]) => (
            <div key={subject}>
              <h3 className="text-xl font-bold text-primary mb-4 border-b border-white/10 pb-2">{subject}</h3>
              <div className="space-y-6">
                {Object.entries(units).map(([unit, unitCards]) => (
                  <div key={unit}>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">{unit}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {unitCards.map(card => (
                        <div key={card.id} className="glass-card p-4 relative group flex flex-col h-40">
                          <h5 className="font-bold text-white text-sm mb-2 line-clamp-2">{card.question}</h5>
                          <p className="text-xs text-gray-400 line-clamp-3 mt-auto pt-2 border-t border-white/10"><span className="text-green-400 font-bold">A:</span> {card.answer}</p>
                          <button onClick={(e) => deleteCard(card.id, e)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass w-full max-w-2xl p-6 relative">
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
              <h3 className="text-xl font-bold text-white mb-6">Add Flashcards</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Add */}
                <form onSubmit={handleAdd} className="space-y-4 border-r border-white/10 pr-6">
                  <h4 className="font-bold text-white text-sm mb-2">Manually Add</h4>
                  <div><label className="text-xs text-gray-400 mb-1 block">Subject</label><input type="text" value={newSub} onChange={e => setNewSub(e.target.value)} placeholder="e.g., Operating Systems" className="w-full bg-black/40 border border-border rounded-xl p-2 text-white" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Unit</label><input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="e.g., CPU Scheduling" className="w-full bg-black/40 border border-border rounded-xl p-2 text-white" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Question</label><textarea value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="What is..." className="w-full bg-black/40 border border-border rounded-xl p-2 text-white resize-none h-20" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Answer</label><textarea value={newA} onChange={e => setNewA(e.target.value)} placeholder="It is..." className="w-full bg-black/40 border border-border rounded-xl p-2 text-white resize-none h-20" /></div>
                  <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-xl transition-all">Save Card</button>
                </form>

                {/* AI Generation */}
                <form onSubmit={handleGenerateAI} className="space-y-4">
                  <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2"><Sparkles size={16} className="text-secondary"/> Generate with AI</h4>
                  <div><label className="text-xs text-gray-400 mb-1 block">Topic / Unit to Generate</label><input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g., Deadlocks, French Revolution" className="w-full bg-black/40 border border-border rounded-xl p-2 text-white" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Number of Cards</label><input type="number" min="1" max="15" value={aiCount} onChange={e => setAiCount(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-2 text-white" /></div>
                  <p className="text-xs text-gray-500 leading-relaxed">The AI will generate flashcards and save them under "AI Generated" subject.</p>
                  <button type="submit" disabled={isGenerating} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isGenerating ? <><Loader2 size={16} className="animate-spin"/> Generating...</> : <><Sparkles size={16}/> Generate Cards</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
