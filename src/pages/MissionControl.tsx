import React, { useState } from 'react';
import { Plus, MoreHorizontal, MessageSquare, Paperclip, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Define types right here to avoid any import errors
type Status = 'Backlog' | 'In Progress' | 'Review' | 'Done';

interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  comments: number;
  attachments: number;
  status: Status;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Create a profile screen', priority: 'Medium', comments: 35, attachments: 16, status: 'Backlog' },
  { id: '2', title: 'Adaptive design for news page', priority: 'High', comments: 12, attachments: 8, status: 'Backlog' },
  { id: '3', title: 'Update UI Kit components', priority: 'Low', comments: 20, attachments: 3, status: 'In Progress' },
  { id: '4', title: 'Conduct customer research', priority: 'High', comments: 24, attachments: 3, status: 'In Progress' },
  { id: '5', title: 'New buttons for design system', priority: 'Medium', comments: 11, attachments: 9, status: 'Review' },
  { id: '6', title: 'Fix navigation bug on mobile', priority: 'High', comments: 5, attachments: 2, status: 'Done' },
];

const COLUMNS: { id: Status; title: string; color: string }[] = [
  { id: 'Backlog', title: 'Backlog', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { id: 'Review', title: 'In Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'Done', title: 'Done', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
];

export default function MissionControl() {
  // Use LocalStorage so tasks persist across refreshes
  const [tasks, setTasks] = useLocalStorage<Task[]>('multiverse-tasks', INITIAL_TASKS);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => (e.target as HTMLElement).classList.add('opacity-50'), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50');
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    setTasks(prev => prev.map(task => 
      task.id === draggedTaskId ? { ...task, status } : task
    ));
    setDraggedTaskId(null);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return 'bg-red-500/20 text-red-400';
    if (priority === 'Medium') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-green-500/20 text-green-400';
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Mission Control</h2>
          <p className="text-gray-400 text-sm">Manage your syllabus objectives.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              className="flex flex-col w-80 min-w-[320px] glass rounded-2xl border border-white/5 bg-panel/30"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`p-4 rounded-t-2xl border-b ${col.color} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-wide uppercase">{col.title}</h3>
                  <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <Plus size={16} className="opacity-50 cursor-pointer hover:opacity-100" />
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {colTasks.map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-[#1e1e24] p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing shadow-sm group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <MoreHorizontal size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <h4 className="text-white font-medium mb-4 leading-snug">{task.title}</h4>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={14} /> {task.comments}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Paperclip size={14} /> {task.attachments}
                      </div>
                      {task.status === 'Done' && (
                        <div className="flex items-center gap-1.5 text-green-400 ml-auto">
                          <CheckCircle2 size={14} /> Done
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {colTasks.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-sm text-gray-500">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
