import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'MCQs', count: 500, fill: '#3b82f6' },
  { name: 'True/False', count: 300, fill: '#60a5fa' },
  { name: 'Descriptive', count: 400, fill: '#93c5fd' },
  { name: 'Coding', count: 320, fill: '#bfdbfe' },
  { name: 'Analytical', count: 200, fill: '#dbeafe' },
];

export default function PerformanceCharts() {
  return (
    <div className="glass p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Question Bank Analysis</h3>
      </div>
      
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: '#121216', borderColor: '#27272a', borderRadius: '8px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
