import React from 'react';

interface HeatmapProps {
  activityData: Record<string, number>; // Format: { '2024-05-20': 2.5, ... } (hours per day)
}

export default function CalendarHeatmap({ activityData = {} }: HeatmapProps) {
  const today = new Date();
  const days = [];

  // Generate the last 182 days (approx 6 months)
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateString = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const hours = activityData[dateString] || 0;
    
    // Map hours to intensity (0-4)
    let intensity = 0;
    if (hours > 0 && hours < 1) intensity = 1;
    else if (hours >= 1 && hours < 2) intensity = 2;
    else if (hours >= 2 && hours < 4) intensity = 3;
    else if (hours >= 4) intensity = 4;

    days.push({ id: dateString, intensity, hours });
  }

  const colors = ['bg-white/5', 'bg-primary/30', 'bg-primary/50', 'bg-primary/70', 'bg-primary'];

  return (
    <div className="glass p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Study Activity</h3>
        <span className="text-sm text-gray-400">Last 6 Months</span>
      </div>
      
      {/* Grid layout for calendar */}
      <div className="flex-1 grid grid-rows-7 grid-flow-col gap-1.5 overflow-hidden">
        {days.map((day) => (
          <div 
            key={day.id} 
            className={`w-3 h-3 rounded-sm ${colors[day.intensity]} hover:ring-2 hover:ring-white/50 transition-all cursor-pointer`}
            title={`${day.hours.toFixed(1)} hours on ${day.id}`}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 justify-end">
        <span>Less</span>
        {colors.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}
