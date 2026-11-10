export interface Subject {
  id: string;
  title: string;
  role: string;
  theme: 'Avengers' | 'Hunger Games' | 'X-Men' | 'Custom';
  progress: number;
  upcoming: string;
  streak: string;
  color: string;
}

export const SUBJECTS: Subject[] = [
  { id: '1', title: 'Operating Systems', role: 'Iron Strategist', theme: 'Avengers', progress: 78, upcoming: 'OS Quiz', streak: '24 days', color: 'from-red-900/40 to-red-500/10' },
  { id: '2', title: 'Data Structures', role: 'The Shield', theme: 'Avengers', progress: 70, upcoming: 'DSA Test', streak: '28 days', color: 'from-blue-900/40 to-blue-500/10' },
  { id: '3', title: 'Thermodynamics', role: 'The Thunder', theme: 'Avengers', progress: 91, upcoming: 'Numericals', streak: '12 days', color: 'from-yellow-900/40 to-yellow-500/10' },
  { id: '4', title: 'Organic Chemistry', role: 'The Mockingjay', theme: 'Hunger Games', progress: 90, upcoming: 'Ch 4 Revision', streak: '24 days', color: 'from-orange-900/40 to-orange-500/10' },
  { id: '5', title: 'Electromagnetism', role: 'The Telepath', theme: 'X-Men', progress: 79, upcoming: 'PYQs', streak: '28 days', color: 'from-purple-900/40 to-purple-500/10' },
  { id: '6', title: 'Computer Networks', role: 'The Phoenix', theme: 'X-Men', progress: 81, upcoming: 'Mock Test', streak: '17 days', color: 'from-pink-900/40 to-pink-500/10' },
];
