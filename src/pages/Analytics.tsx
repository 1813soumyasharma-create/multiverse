import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Subject {
  id: string;
  title: string;
  progress: number;
  theme: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/subjects`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(subs);
    });
    return unsubscribe;
  }, [user]);

  // Calculate Predictive Score
  const predictedScore = subjects.length > 0 
    ? Math.round(subjects.reduce((acc, sub) => acc + sub.progress, 0) / subjects.length) 
    : 0;

  // Prepare data for charts
  const chartData = subjects.map(sub => ({
    name: sub.title.substring(0, 10) + (sub.title.length > 10 ? '...' : ''),
    score: sub.progress,
    fill: sub.theme === 'Avengers' ? '#e23636' : sub.theme === 'Hunger Games' ? '#ff6b1a' : '#f5d90a'
  }));

  // Identify weak spots (anything below 60%)
  const weakSpots = subjects.filter(sub => sub.progress < 60);

  return (
    <div className="p-8 h-full overflow-y-auto pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Intelligence Centre</h2>
        <p className="text-gray-400 text-sm">AI-driven predictions based on your cloud data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Predictive Score Ring */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target size={14} className="text-primary"/> Predicted Marks
            </p>
            <h3 className="text-4xl font-black text-white">{predictedScore}<span className="text-lg text-gray-500 font-medium">/100</span></h3>
            <p className="text-green-400 text-xs mt-2 flex items-center gap-1"><TrendingUp size={12}/> Based on current coverage</p>
          </div>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={2 * Math.PI * 40} 
                strokeDashoffset={2 * Math.PI * 40 * (1 - predictedScore / 100)} 
                className="text-primary transition-all duration-1000 ease-out" />
            </svg>
          </div>
        </div>

        {/* Subject Progress Chart */}
        <div className="glass p-6 rounded-2xl lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Syllabus Coverage by Subject</h3>
          <div className="flex-1 min-h-[150px]">
            {subjects.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#121216', borderColor: '#27272a', borderRadius: '8px' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 text-sm">Add subjects to see analytics.</div>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <h3 className="text-lg font-bold text-white mb-4">Recommended Next Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weakSpots.length > 0 ? (
          weakSpots.map(spot => (
            <div key={spot.id} className="glass border border-red-500/30 bg-red-500/5 p-5 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-red-500/20 rounded-lg text-red-400 mt-1"><AlertTriangle size={20} /></div>
              <div>
                <h4 className="text-white font-bold mb-1">Prioritize {spot.title}</h4>
                <p className="text-sm text-gray-400">Your coverage is currently at <strong className="text-red-400">{spot.progress}%</strong>. Based on historical PYQs, this subject requires more attention.</p>
              </div>
            </div>
          ))
        ) : (
          <div className="glass border border-green-500/30 bg-green-500/5 p-5 rounded-2xl flex items-start gap-4">
             <div className="p-2 bg-green-500/20 rounded-lg text-green-400 mt-1"><CheckCircle2 size={20} /></div>
             <div>
               <h4 className="text-white font-bold mb-1">You're on track!</h4>
               <p className="text-sm text-gray-400">All your subjects have healthy syllabus coverage. Keep maintaining your study streak.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
