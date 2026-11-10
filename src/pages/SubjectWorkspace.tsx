import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Bot, X, ArrowLeft, Upload, Link as LinkIcon, Menu, PenTool, Highlighter, Eraser, Save, Trash2, PlayCircle, FileImage, AlertCircle, Bookmark, StickyNote, GripHorizontal, ChevronLeft, ChevronRight, ChevronDown, Eye, EyeOff, PieChart as PieIcon, Edit2, HelpCircle, Plus, ExternalLink, Sparkles, TrendingUp, CheckCircle2, AlertTriangle, Settings, CheckSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { collection, onSnapshot, addDoc, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';
import { GoogleGenAI } from '@google/genai';
import ReactPlayer from 'react-player';
import { extractTextFromPdf } from '../lib/pdfExtractor';
import type { Subject } from './Dashboard';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface StickyNoteData { id: string; x: number; y: number; text: string; page: number; }
interface Material {
  id: string; title: string; type: 'pdf' | 'image' | 'video' | 'url' | 'ppt'; url: string; unit: string;
  annotations?: string; isBookmarked?: boolean; stickyNotes?: StickyNoteData[]; textContent?: string;
}
interface PYQ {
  id: string; title: string; year: string; unit: string; marks: number; fileUrl?: string; fileType?: string; textContent?: string;
}
interface Task {
  id: string; title: string; status: 'todo' | 'progress' | 'done'; priority: 'High' | 'Medium' | 'Low';
}

interface WorkspaceProps { subject: Subject | null; onBack: () => void; }

export default function SubjectWorkspace({ subject, onBack }: WorkspaceProps) {
  const { user } = useAuth();
  
  const [activeView, setActiveView] = useState<'documents' | 'pyqs' | 'analytics' | 'tasks'>('documents');
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPyqOpen, setIsPyqOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#e23636');
  const [drawMode, setDrawMode] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [eraserSize, setEraserSize] = useState(20);
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(800); 
  
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [notes, setNotes] = useState<StickyNoteData[]>([]);
  const [isNotesMenuOpen, setIsNotesMenuOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [messages, setMessages] = useState([{ role: 'bot', text: `Hello! I am ready to help you study ${subject?.title || 'this subject'}.` }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini-key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(!apiKey);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(subject?.title || '');
  const [editRole, setEditRole] = useState(subject?.role || '');
  const [editTheme, setEditTheme] = useState(subject?.theme || 'Avengers');
  const [editExamDate, setEditExamDate] = useState(subject?.examDate || '');

  const [uploadUnit, setUploadUnit] = useState('General');
  const [uploadTitle, setUploadTitle] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [pyqTitle, setPyqTitle] = useState('');
  const [pyqYear, setPyqYear] = useState('');
  const [pyqUnit, setPyqUnit] = useState('General');
  const [pyqMarks, setPyqMarks] = useState('');
  const [pyqFile, setPyqFile] = useState<File | null>(null);
  const [isPyqSaving, setIsPyqSaving] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High'|'Medium'|'Low'>('Medium');

  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1); setNumPages(null); setActiveNoteId(null);
    if (subject) {
      setEditTitle(subject.title); setEditRole(subject.role); setEditTheme(subject.theme); setEditExamDate(subject.examDate || '');
    }
  }, [activeMaterial?.id, subject]);

  useEffect(() => {
    if (!user || !subject) return;
    const unsubMats = onSnapshot(query(collection(db, `users/${user.uid}/subjects/${subject.id}/materials`)), (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
      setMaterials(mats);
      if (activeMaterial) {
        const updated = mats.find(m => m.id === activeMaterial.id);
        if (updated) setActiveMaterial(updated);
      } else if (mats.length > 0) setActiveMaterial(mats[0]);
    });
    const unsubPyqs = onSnapshot(query(collection(db, `users/${user.uid}/subjects/${subject.id}/pyqs`)), (snapshot) => {
      setPyqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PYQ)));
    });
    const unsubTasks = onSnapshot(query(collection(db, `users/${user.uid}/subjects/${subject.id}/tasks`)), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    return () => { unsubMats(); unsubPyqs(); unsubTasks(); };
  }, [user, subject]);

  useEffect(() => {
    if (activeMaterial && activeMaterial.stickyNotes) setNotes(activeMaterial.stickyNotes);
    else setNotes([]);
  }, [activeMaterial]);

  useEffect(() => {
    const handleResize = () => { if (containerRef.current) setPdfWidth(containerRef.current.clientWidth - 40); };
    window.addEventListener('resize', handleResize); handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveKey = (key: string) => { const cleanKey = key.trim(); setApiKey(cleanKey); localStorage.setItem('gemini-key', cleanKey); setIsSettingsOpen(false); };
  const handleSaveSubjectDetails = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !subject) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/subjects`, subject.id), { title: editTitle, role: editRole, theme: editTheme, examDate: editExamDate });
      setIsSubjectModalOpen(false);
    } catch (err) { alert("Failed to update details."); }
  };
  const openUploadModal = () => { setEditingMaterialId(null); setUploadTitle(''); setUploadUnit('General'); setUploadError(''); setIsUploadOpen(true); };
  const handleUpdateMaterial = async () => {
    if (!user || !subject || !editingMaterialId) return;
    setIsUploading(true); setUploadError('');
    try {
      await updateDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/materials`, editingMaterialId), { title: uploadTitle, unit: uploadUnit });
      setIsUploadOpen(false); setEditingMaterialId(null);
    } catch (err: any) { setUploadError(err.message); } finally { setIsUploading(false); }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user || !subject) return;
    setIsUploading(true); setUploadError(''); setUploadStatus('Uploading...');
    try {
      let downloadUrl = '', textContent = '', type: Material['type'] = 'image';
      const fileExt = file.name.split('.').pop(); const fileName = `${user.uid}/${subject.id}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('materials').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName);
      downloadUrl = urlData.publicUrl;
      if (file.type.includes('pdf')) { type = 'pdf'; setUploadStatus('Extracting text...'); textContent = await extractTextFromPdf(file); } 
      else if (file.type.includes('video')) type = 'video';
      else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) type = 'ppt';
      await addDoc(collection(db, `users/${user.uid}/subjects/${subject.id}/materials`), {
        title: uploadTitle || file.name, type, url: downloadUrl, unit: uploadUnit, isBookmarked: false, stickyNotes: [], textContent
      });
      setIsUploadOpen(false); setUploadTitle('');
    } catch (err: any) { setUploadError(err.message); } finally { setIsUploading(false); setUploadStatus(''); }
  };
  const handleDeleteMaterial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!user || !subject || !confirm('Delete this material?')) return;
    await deleteDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/materials`, id));
    if (activeMaterial?.id === id) setActiveMaterial(null);
  };
  const openEditMaterial = (mat: Material, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingMaterialId(mat.id); setUploadTitle(mat.title); setUploadUnit(mat.unit); setUploadError(''); setIsUploadOpen(true);
  };
  const saveAnnotations = async () => {
    if (!canvasRef.current || !user || !subject || !activeMaterial) return;
    const dataUrl = await canvasRef.current.exportImage("png");
    await updateDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/materials`, activeMaterial.id), { annotations: dataUrl });
    setActiveMaterial({ ...activeMaterial, annotations: dataUrl }); setIsDrawing(false);
  };
  const toggleBookmark = async () => {
    if (!user || !subject || !activeMaterial) return;
    await updateDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/materials`, activeMaterial.id), { isBookmarked: !activeMaterial.isBookmarked });
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isAddingNote || !containerRef.current || !user || !subject || !activeMaterial) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newNotes = [...notes, { id: Date.now().toString(), x, y, text: '', page: currentPage }];
    setNotes(newNotes); setIsAddingNote(false); setActiveNoteId(newNotes[newNotes.length-1].id); saveNotes(newNotes);
  };
  const updateNoteText = (id: string, text: string) => setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
  const removeNote = (id: string, e: React.MouseEvent) => { e.stopPropagation(); const newNotes = notes.filter(n => n.id !== id); setNotes(newNotes); if (activeNoteId === id) setActiveNoteId(null); saveNotes(newNotes); };
  const saveNotes = async (notesToSave = notes) => {
    if (!user || !subject || !activeMaterial) return;
    await updateDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/materials`, activeMaterial.id), { stickyNotes: notesToSave });
  };
  const handleDragStart = (e: React.PointerEvent, id: string) => {
    e.stopPropagation(); setDraggedNoteId(id);
    const note = notes.find(n => n.id === id); if (!note || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({ x: (e.clientX - rect.left) - (note.x / 100) * rect.width, y: (e.clientY - rect.top) - (note.y / 100) * rect.height });
  };
  const handleDragMove = (e: React.PointerEvent) => {
    if (!draggedNoteId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setNotes(prev => prev.map(n => n.id === draggedNoteId ? { ...n, x: Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100)) } : n));
  };
  const handleDragEnd = () => { if (draggedNoteId) saveNotes(); setDraggedNoteId(null); };
  const handleSavePyq = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !subject || !pyqTitle) return; setIsPyqSaving(true);
    try {
      let fileUrl = '', fileType = '', textContent = '';
      if (pyqFile) {
        const fileExt = pyqFile.name.split('.').pop(); const fileName = `${user.uid}/${subject.id}/pyqs/${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('materials').upload(fileName, pyqFile, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName);
        fileUrl = urlData.publicUrl; fileType = pyqFile.type;
        if (pyqFile.type.includes('pdf')) textContent = await extractTextFromPdf(pyqFile);
      }
      await addDoc(collection(db, `users/${user.uid}/subjects/${subject.id}/pyqs`), {
        title: pyqTitle, year: pyqYear, unit: pyqUnit, marks: Number(pyqMarks) || 0, fileUrl, fileType, textContent
      });
      setIsPyqOpen(false); setPyqTitle(''); setPyqYear(''); setPyqMarks(''); setPyqFile(null);
    } catch (err) { alert("Error saving PYQ: " + err); } finally { setIsPyqSaving(false); }
  };
  const deletePyq = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!user || !subject || !confirm('Delete PYQ?')) return;
    await deleteDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/pyqs`, id));
  };
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !subject || !newTaskTitle.trim()) return;
    await addDoc(collection(db, `users/${user.uid}/subjects/${subject.id}/tasks`), { title: newTaskTitle, status: 'todo', priority: newTaskPriority });
    setIsTaskModalOpen(false); setNewTaskTitle('');
  };
  const moveTask = async (taskId: string, currentStatus: string) => {
    if (!user || !subject) return;
    let nextStatus = 'todo'; if (currentStatus === 'todo') nextStatus = 'progress'; else if (currentStatus === 'progress') nextStatus = 'done';
    await updateDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/tasks`, taskId), { status: nextStatus });
  };
  const deleteTask = async (taskId: string) => {
    if (!user || !subject) return;
    await deleteDoc(doc(db, `users/${user.uid}/subjects/${subject.id}/tasks`, taskId));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); if (!input.trim() || !apiKey) return;
    const userMsg = input; setMessages(prev => [...prev, { role: 'user', text: userMsg }]); setInput(''); setIsLoading(true);
    try {
      let contextText = ""; materials.forEach(m => { if (m.textContent) contextText += `\n--- ${m.title} ---\n${m.textContent.substring(0, 4000)}...\n`; });
      const prompt = `Tutor for ${subject?.title}. Docs:\n${contextText}\n\nQ: ${userMsg}`;
      const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
      let botText = ""; let success = false; let lastError;
      for (const modelName of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({ model: modelName, contents: prompt });
          botText = response.text || "No response."; success = true; break;
        } catch (error: any) { lastError = error; if (error.message.includes("503") || error.message.includes("high demand")) await new Promise(r => setTimeout(r, 1000)); }
      }
      if (!success) throw lastError;
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error: any) { setMessages(prev => [...prev, { role: 'bot', text: `Error: ${error.message}` }]); } finally { setIsLoading(false); }
  };

  const calculateMaterialWeights = () => {
    if (materials.length === 0) return [];
    if (pyqs.length === 0) return materials.map(m => ({ ...m, score: 0, reasons: [], percentage: 0 }));
    const stopWords = new Set(['what', 'which', 'when', 'where', 'who', 'why', 'how', 'explain', 'describe', 'define', 'discuss', 'write', 'short', 'note', 'notes', 'question', 'marks', 'mark', 'unit', 'chapter', 'year', 'briefly', 'detail', 'details', 'example', 'examples', 'important', 'the', 'and', 'with', 'from', 'this', 'that', 'these', 'those', 'a', 'an', 'in', 'on', 'of', 'to', 'for', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had']);
    const getKeywords = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const scoredMaterials = materials.map(mat => {
      let score = 0; const reasons: string[] = [];
      const matUnit = (mat.unit || 'Unassigned').toLowerCase().trim(); const matText = `${mat.title} ${mat.textContent || ''}`.toLowerCase();
      const matWords = getKeywords(matText); const matFreq: Record<string, number> = {}; matWords.forEach(w => matFreq[w] = (matFreq[w] || 0) + 1);
      pyqs.forEach(pyq => {
        const pyqUnit = (pyq.unit || 'Unassigned').toLowerCase().trim(); const pyqText = `${pyq.title} ${pyq.textContent || ''}`;
        const pyqWords = getKeywords(pyqText); const marks = Number(pyq.marks) || 1; let pyqScore = 0;
        if (matUnit !== 'unassigned' && pyqUnit !== 'unassigned' && (matUnit === pyqUnit || matUnit.includes(pyqUnit) || pyqUnit.includes(matUnit))) {
          pyqScore += 200; if (!reasons.includes(`Unit Match: ${pyq.unit}`)) reasons.push(`Unit Match: ${pyq.unit}`);
        }
        let matchCount = 0; pyqWords.forEach(word => {
          if (matFreq[word]) { pyqScore += word.length * Math.min(matFreq[word], 10); matchCount++; if (matchCount <= 4 && !reasons.includes(`Keyword: ${word}`)) reasons.push(`Keyword: ${word}`); }
        });
        score += pyqScore * marks;
      });
      if (score === 0) {
        if (mat.type !== 'pdf') reasons.push("Upload as PDF to read text");
        else if (!mat.textContent || mat.textContent.length < 50) reasons.push(`Text missing. Re-upload file.`);
        else reasons.push("No keyword matches found");
      } else if (mat.textContent) { reasons.push(`Read ${mat.textContent.length} chars`); }
      return { ...mat, score, reasons: [...new Set(reasons)] };
    });
    const totalScore = scoredMaterials.reduce((sum, m) => sum + m.score, 0);
    return scoredMaterials.map(m => ({ ...m, percentage: totalScore > 0 ? Math.round((m.score / totalScore) * 100) : 0 })).sort((a, b) => b.score - a.score);
  };

  const weightedMaterials = calculateMaterialWeights();
  const visibleNotes = notes.filter(n => n.page === currentPage && n.id === activeNoteId);

  if (!subject) return <div className="p-8 text-white">Select a subject first.</div>;

  return (
    <div className="flex h-full w-full bg-black/20 relative overflow-hidden" onPointerMove={handleDragMove} onPointerUp={handleDragEnd}>
      
      <div className="w-72 border-r border-white/10 flex flex-col bg-panel/30 shrink-0 transition-all z-20">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> Back</button>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsSubjectModalOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Subject Settings"><Settings size={16} /></button>
            {activeView === 'documents' && (<button onClick={openUploadModal} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30" title="Upload Material"><Upload size={16} /></button>)}
            {activeView === 'pyqs' && (<button onClick={() => setIsPyqOpen(true)} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30" title="Add PYQ"><Plus size={16} /></button>)}
            {activeView === 'tasks' && (<button onClick={() => setIsTaskModalOpen(true)} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30" title="Add Task"><Plus size={16} /></button>)}
          </div>
        </div>

        <div className="p-3 border-b border-white/10 grid grid-cols-4 gap-1 bg-black/20">
          <button onClick={() => setActiveView('documents')} className={`py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeView === 'documents' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Docs</button>
          <button onClick={() => setActiveView('pyqs')} className={`py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeView === 'pyqs' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>PYQs</button>
          <button onClick={() => setActiveView('tasks')} className={`py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeView === 'tasks' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Tasks</button>
          <button onClick={() => setActiveView('analytics')} className={`py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeView === 'analytics' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Stats</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeView === 'documents' && materials.map(mat => (
            <div key={mat.id} onClick={() => { setActiveMaterial(mat); setIsDrawing(false); setIsAddingNote(false); }}
              className={`group w-full flex items-center justify-between p-2 rounded-lg text-sm text-left cursor-pointer transition-all ${activeMaterial?.id === mat.id ? 'bg-primary/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <div className="flex items-center gap-2 truncate flex-1">
                {mat.type === 'pdf' || mat.type === 'ppt' ? <FileText size={16} /> : mat.type === 'video' ? <PlayCircle size={16} /> : <FileImage size={16} />}
                <span className="truncate">{mat.title}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => openEditMaterial(mat, e)} className="p-1 hover:text-primary"><Edit2 size={12}/></button>
                <button onClick={(e) => handleDeleteMaterial(mat.id, e)} className="p-1 hover:text-red-400"><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
          
          {activeView === 'pyqs' && pyqs.map(pyq => (
            <div key={pyq.id} className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-start group">
              <div>
                <p className="text-sm font-bold text-white mb-1">{pyq.title}</p>
                <div className="flex gap-2 text-xs"><span className="text-primary">{pyq.unit}</span><span className="text-gray-400">{pyq.year}</span><span className="text-yellow-400">{pyq.marks} marks</span></div>
              </div>
              <button onClick={(e) => deletePyq(pyq.id, e)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#1a1a1f] relative">
        
        {activeView === 'analytics' && (
          <div className="p-8 h-full overflow-y-auto">
            <div className="mb-8"><h2 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="text-secondary" /> Material Weight Analysis</h2><p className="text-gray-400 text-sm mt-1">AI reads your PDFs and weights them based on term frequency against your PYQs.</p></div>
            {pyqs.length === 0 ? (
              <div className="glass p-12 flex flex-col items-center justify-center text-gray-400 rounded-2xl border border-dashed border-white/20 text-center"><HelpCircle size={48} className="mb-4 opacity-50" /><h3 className="text-lg font-bold text-white mb-2">No PYQs Added Yet</h3><p className="max-w-md">You need to add Previous Year Questions before we can analyze.</p></div>
            ) : weightedMaterials.every(m => m.score === 0) ? (
              <div className="glass p-12 flex flex-col items-center justify-center text-yellow-500 rounded-2xl border border-dashed border-yellow-500/30 text-center bg-yellow-500/5"><AlertTriangle size={48} className="mb-4 opacity-80" /><h3 className="text-lg font-bold text-white mb-2">No Text Matches Found</h3><p className="max-w-md text-gray-400 mb-4">The system couldn't find any matching keywords.</p></div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {weightedMaterials.map((mat, index) => (
                  <div key={mat.id} className="glass p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-1000 ease-out" style={{ width: `${mat.percentage}%` }}></div>
                    <div className="relative z-10 flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${index === 0 && mat.percentage > 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/10 text-gray-400'}`}>{index === 0 && mat.percentage > 0 ? <TrendingUp size={20} /> : `#${index + 1}`}</div>
                        <div><h3 className="font-bold text-white text-lg leading-tight mb-1">{mat.title}</h3><p className="text-xs text-gray-400 uppercase tracking-wider">{mat.unit} • {mat.type}</p>
                          <div className="flex flex-wrap gap-2 mt-2">{mat.reasons.map((r, i) => (<span key={i} className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${r.includes('No') || r.includes('Upload') || r.includes('missing') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>{!r.includes('No') && !r.includes('Upload') && !r.includes('missing') && <CheckCircle2 size={10} />} {r}</span>))}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4"><span className={`text-3xl font-black ${mat.percentage === 0 ? 'text-gray-600' : 'text-white'}`}>{mat.percentage}%</span><p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Relevance</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'pyqs' && (
          <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8"><div><h2 className="text-2xl font-bold text-white mb-1">PYQ Vault</h2><p className="text-gray-400 text-sm">Manage and view your past year questions.</p></div><button onClick={() => setIsPyqOpen(true)} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"><Plus size={16} /> Add PYQ</button></div>
            {pyqs.length === 0 ? (<div className="glass p-12 flex flex-col items-center justify-center text-gray-400 rounded-2xl border border-dashed border-white/20"><HelpCircle size={48} className="mb-4 opacity-50" /><p>No PYQs yet.</p></div>) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pyqs.map(pyq => (
                  <div key={pyq.id} className="glass-card p-5 relative group flex flex-col h-48">
                    <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">{pyq.unit}</span><button onClick={(e) => deletePyq(pyq.id, e)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button></div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-2">{pyq.title}</h3>
                    <div className="flex gap-2 text-xs mb-4"><span className="bg-white/10 px-2 py-1 rounded text-gray-300">Year: {pyq.year || 'N/A'}</span><span className="bg-yellow-500/20 px-2 py-1 rounded text-yellow-400 font-bold">{pyq.marks} Marks</span></div>
                    <div className="mt-auto pt-4 border-t border-white/10">{pyq.fileUrl ? (<a href={pyq.fileUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"><ExternalLink size={14} /> View Document</a>) : (<div className="w-full text-center py-2 text-xs text-gray-500 italic">No file attached</div>)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div><h2 className="text-2xl font-bold text-white mb-1">Task Board</h2><p className="text-gray-400 text-sm">Track your syllabus and revision progress.</p></div>
              <button onClick={() => setIsTaskModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"><Plus size={16} /> Add Task</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-4 flex flex-col h-[60vh]">
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><h3 className="text-sm font-bold text-white uppercase tracking-wider">To Do</h3><span className="ml-auto text-xs bg-white/10 px-2 rounded-full text-gray-400">{tasks.filter(t => t.status === 'todo').length}</span></div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {tasks.filter(t => t.status === 'todo').map(task => (
                    <div key={task.id} className="bg-[#1e1e24] p-4 rounded-xl border border-white/5 group relative">
                      <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' : task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{task.priority}</span><button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>
                      <p className="text-sm text-white font-medium mb-4">{task.title}</p>
                      <button onClick={() => moveTask(task.id, 'todo')} className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded flex items-center justify-center gap-1 transition-colors">Start <ArrowRight size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-4 flex flex-col h-[60vh]">
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><h3 className="text-sm font-bold text-white uppercase tracking-wider">In Progress</h3><span className="ml-auto text-xs bg-white/10 px-2 rounded-full text-gray-400">{tasks.filter(t => t.status === 'progress').length}</span></div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {tasks.filter(t => t.status === 'progress').map(task => (
                    <div key={task.id} className="bg-[#1e1e24] p-4 rounded-xl border border-white/5 group relative">
                      <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' : task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{task.priority}</span><button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>
                      <p className="text-sm text-white font-medium mb-4">{task.title}</p>
                      <button onClick={() => moveTask(task.id, 'progress')} className="w-full py-1.5 bg-green-500/10 hover:bg-green-500/20 text-xs text-green-400 rounded flex items-center justify-center gap-1 transition-colors"><CheckSquare size={12}/> Mark Done</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-4 flex flex-col h-[60vh]">
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><h3 className="text-sm font-bold text-white uppercase tracking-wider">Done</h3><span className="ml-auto text-xs bg-white/10 px-2 rounded-full text-gray-400">{tasks.filter(t => t.status === 'done').length}</span></div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {tasks.filter(t => t.status === 'done').map(task => (
                    <div key={task.id} className="bg-[#1e1e24] p-4 rounded-xl border border-white/5 group relative opacity-60">
                      <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase bg-green-500/10 text-green-500 border border-green-500/20">Completed</span><button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>
                      <p className="text-sm text-gray-300 font-medium line-through">{task.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'documents' && (
          <>
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-panel/80 backdrop-blur-md z-30 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden mr-4">
                {activeMaterial && <button onClick={() => setActiveMaterial(null)} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg shrink-0"><X size={18} /></button>}
                <div className="text-sm font-medium text-white truncate max-w-[200px]">{activeMaterial ? activeMaterial.title : 'No document open'}</div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {!activeMaterial && (
                  <button onClick={openUploadModal} className="bg-primary/20 hover:bg-primary/30 text-primary px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><Upload size={16} /> Upload</button>
                )}
                {activeMaterial && (
                  <>
                    <button onClick={toggleBookmark} className={`p-2 rounded ${activeMaterial.isBookmarked ? 'text-yellow-400 bg-white/5' : 'text-gray-400 hover:bg-white/10'}`}><Bookmark size={16} className={activeMaterial.isBookmarked ? "fill-yellow-400" : ""} /></button>
                    <div className="relative">
                      <div className="flex bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                        <button onClick={() => { setIsAddingNote(!isAddingNote); setIsDrawing(false); }} className={`p-2 ${isAddingNote ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-white/10'}`}><StickyNote size={16} /></button>
                        <div className="w-px bg-white/10"></div>
                        <button onClick={() => setIsNotesMenuOpen(!isNotesMenuOpen)} className="px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 flex items-center gap-1">Notes ({notes.filter(n => n.page === currentPage).length}) <ChevronDown size={12} /></button>
                      </div>
                      {isNotesMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-64">
                          <div className="p-2 border-b border-white/10 bg-black/20 text-xs font-bold text-gray-400 uppercase">Notes for Page {currentPage}</div>
                          <div className="overflow-y-auto flex-1 p-1">
                            {notes.filter(n => n.page === currentPage).length === 0 ? <div className="p-4 text-center text-xs text-gray-500">No notes.</div> : 
                              notes.filter(n => n.page === currentPage).map(note => (
                                <button key={note.id} onClick={() => setActiveNoteId(activeNoteId === note.id ? null : note.id)} className={`w-full text-left p-2 rounded-lg text-sm mb-1 flex items-start gap-2 ${activeNoteId === note.id ? 'bg-yellow-500/20 text-yellow-200' : 'text-gray-300 hover:bg-white/5'}`}>
                                  {activeNoteId === note.id ? <EyeOff size={14} /> : <Eye size={14} />} <span className="line-clamp-2">{note.text || 'Empty Note'}</span>
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    {isDrawing ? (
                      <>
                        <button onClick={() => { setDrawMode('pen'); canvasRef.current?.eraseMode(false); }} className={`p-2 rounded ${drawMode === 'pen' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/10'}`}><PenTool size={16} /></button>
                        <button onClick={() => { setDrawMode('highlighter'); canvasRef.current?.eraseMode(false); }} className={`p-2 rounded ${drawMode === 'highlighter' ? 'bg-yellow-500/50 text-white' : 'text-gray-400 hover:bg-white/10'}`}><Highlighter size={16} /></button>
                        <button onClick={() => { setDrawMode('eraser'); canvasRef.current?.eraseMode(true); }} className={`p-2 rounded ${drawMode === 'eraser' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10'}`}><Eraser size={16} /></button>
                        {drawMode === 'eraser' && <input type="range" min="5" max="50" value={eraserSize} onChange={(e) => setEraserSize(Number(e.target.value))} className="w-16 accent-white cursor-pointer ml-2" />}
                        <button onClick={() => canvasRef.current?.undo()} className="p-2 text-gray-400 hover:bg-white/10 rounded">Undo</button>
                        <button onClick={() => canvasRef.current?.clearCanvas()} className="p-2 text-red-400 hover:bg-white/10 rounded"><Trash2 size={16} /></button>
                        <button onClick={saveAnnotations} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm ml-2"><Save size={14}/> Save</button>
                        <button onClick={() => setIsDrawing(false)} className="px-3 py-1.5 bg-white/10 rounded text-sm hover:bg-white/20 ml-2">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => { setIsDrawing(true); setIsAddingNote(false); }} className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white"><PenTool size={16} /> Annotate</button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center relative pb-24" onClick={() => setIsNotesMenuOpen(false)}>
              {activeMaterial ? (
                <div className="relative w-full max-w-4xl flex justify-center" ref={containerRef} onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    {activeMaterial.type === 'image' && <img src={activeMaterial.url} className="max-w-full h-auto rounded object-contain" />}
                    {activeMaterial.type === 'pdf' && (
                      <div className="bg-white rounded shadow-2xl overflow-hidden">
                        <Document 
                          file={activeMaterial.url} 
                          onLoadSuccess={({ numPages }) => setNumPages(numPages)} 
                          onLoadError={(error) => console.error("PDF Load Error:", error)}
                          className="flex flex-col items-center"
                        >
                          <Page pageNumber={currentPage} width={pdfWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                        </Document>
                      </div>
                    )}
                    {activeMaterial.type === 'ppt' && (
                      <div className="w-full flex flex-col items-center">
                         <div className="flex justify-between items-center w-full mb-2">
                           <p className="text-xs text-gray-400">Use the arrows inside the slide window below to change slides</p>
                           <a href={activeMaterial.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Open Original <ExternalLink size={12}/></a>
                         </div>
                        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeMaterial.url)}`} className="w-[900px] max-w-full h-[75vh] rounded border-none bg-white shadow-2xl" title="PPT" />
                      </div>
                    )}
                    {activeMaterial.type === 'video' && <div className="w-full aspect-video bg-black rounded overflow-hidden shadow-2xl"><ReactPlayer url={activeMaterial.url} controls width="100%" height="100%" /></div>}
                    {activeMaterial.type === 'url' && <iframe src={activeMaterial.url} className="w-[800px] h-[600px] rounded border-none bg-white shadow-2xl" title="Web" />}

                    {isDrawing && (
                      <div className="absolute inset-0 z-20 pointer-events-auto">
                        <ReactSketchCanvas ref={canvasRef} strokeWidth={drawMode === 'highlighter' ? 15 : 4} strokeColor={drawMode === 'highlighter' ? 'rgba(255, 230, 0, 0.4)' : drawColor} eraserWidth={eraserSize} canvasColor="transparent" style={{ border: 'none' }} allowOnlyPointerType="all" withTimestamp={true} />
                      </div>
                    )}
                    {!isDrawing && activeMaterial.annotations && <img src={activeMaterial.annotations} className="absolute inset-0 pointer-events-none w-full h-full object-contain z-10" />}
                    {isAddingNote && <div className="absolute inset-0 z-30 cursor-crosshair bg-black/10 transition-all" onClick={handleOverlayClick}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 px-4 py-2 rounded-full text-white text-sm pointer-events-none">Click to place note on Page {currentPage}</div></div>}
                    
                    {visibleNotes.map(note => (
                      <div key={note.id} className={`absolute w-56 bg-yellow-200 text-black rounded-lg shadow-xl z-40 group border border-yellow-300 ${draggedNoteId === note.id ? 'opacity-80 scale-105' : ''}`} style={{ left: `${note.x}%`, top: `${note.y}%` }} onClick={(e) => e.stopPropagation()}>
                        <div className="h-6 bg-yellow-300/80 rounded-t-lg flex items-center justify-between px-2 cursor-grab active:cursor-grabbing hover:bg-yellow-400/80 transition-colors" onPointerDown={(e) => handleDragStart(e, note.id)}>
                          <GripHorizontal size={14} className="text-yellow-800" />
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setActiveNoteId(null); }} className="text-yellow-800 hover:text-yellow-900 bg-white/50 hover:bg-white rounded-full p-0.5"><EyeOff size={10} /></button>
                            <button onClick={(e) => removeNote(note.id, e)} className="text-red-500 hover:text-red-700 bg-white/50 hover:bg-white rounded-full p-0.5"><X size={10} /></button>
                          </div>
                        </div>
                        <div className="p-2"><textarea className="w-full h-24 bg-transparent resize-none outline-none text-sm font-sans placeholder-yellow-700/50" value={note.text} onChange={(e) => updateNoteText(note.id, e.target.value)} onBlur={() => saveNotes()} placeholder="Type note..." /></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 flex-col">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="mb-6">Select a material from the left sidebar to view it, or upload a new one.</p>
                  <button onClick={openUploadModal} className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"><Upload size={18} /> Upload Material</button>
                </div>
              )}
            </div>

            {/* BULLETPROOF PAGINATION (Fixed to screen) */}
            {activeMaterial?.type === 'pdf' && numPages && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1e1e24] px-6 py-3 rounded-2xl border border-white/20 shadow-2xl z-[100]">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-2 disabled:opacity-30 hover:bg-white/10 rounded-lg text-white transition-colors"><ChevronLeft size={20}/></button>
                <span className="text-sm font-bold text-white tracking-wider min-w-[80px] text-center">Page {currentPage} / {numPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="p-2 disabled:opacity-30 hover:bg-white/10 rounded-lg text-white transition-colors"><ChevronRight size={20}/></button>
              </div>
            )}
          </>
        )}
      </div>

      <div className={`absolute top-0 right-0 h-full w-[400px] bg-panel border-l border-border shadow-2xl flex flex-col transition-transform duration-300 z-40 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-panel/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-white font-medium"><Bot size={18} className="text-secondary" /> AI Assistant</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white p-2" title="API Settings"><Settings size={18} /></button>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white p-2"><X size={20} /></button>
          </div>
        </div>
        
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass p-6 rounded-2xl w-full max-w-sm relative">
              <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
              <h3 className="text-lg font-bold text-white mb-2">Connect AI Assistant</h3>
              <p className="text-xs text-gray-400 mb-4">Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary hover:underline">Google AI Studio</a>.</p>
              <input type="password" placeholder="Paste Gemini API Key (AIzaSy...)" defaultValue={apiKey} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:border-primary outline-none" onKeyDown={(e) => { if (e.key === 'Enter') saveKey((e.target as HTMLInputElement).value) }} />
              <button onClick={() => { const val = (document.querySelector('input[type="password"]') as HTMLInputElement).value; if (val) saveKey(val); }} className="w-full bg-primary hover:bg-primary/90 py-2 rounded-xl text-white font-medium transition-all">Save & Connect</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (<div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}><div className={`p-3 rounded-2xl max-w-[90%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'}`}>{msg.text}</div></div>))}
          {isLoading && <div className="text-gray-400 text-sm animate-pulse">Thinking...</div>}
        </div>
        <div className="p-4 border-t border-white/10 bg-black/20">
          <form onSubmit={handleSend} className="relative">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about this subject..." disabled={isLoading || !apiKey} className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary/50 disabled:opacity-50" />
            <button type="submit" disabled={isLoading || !apiKey} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"><Send size={16} /></button>
          </form>
        </div>
      </div>

      <button onClick={() => setIsChatOpen(true)} className={`absolute right-6 bottom-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-20 ${isChatOpen ? 'hidden' : 'block'}`}><Menu size={24} /></button>

      {/* EDIT SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsSubjectModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-bold text-white mb-6">Subject Settings</h3>
            <form onSubmit={handleSaveSubjectDetails} className="space-y-4">
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Subject Name</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" required /></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Your Role</label><input type="text" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Exam Date</label><input type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none [color-scheme:dark]" /></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Theme</label><select value={editTheme} onChange={(e) => setEditTheme(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none cursor-pointer"><option value="Avengers">Avengers</option><option value="Hunger Games">Hunger Games</option><option value="X-Men">X-Men</option></select></div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl mt-4 transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-bold text-white mb-6">Add New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Task Title</label><input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="e.g., Revise Chapter 4" className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" autoFocus /></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Priority</label><select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as any)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none cursor-pointer"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl mt-4 transition-all">Create Task</button>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD/EDIT MATERIAL MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsUploadOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-bold text-white mb-6">{editingMaterialId ? 'Edit Material' : 'Add Study Material'}</h3>
            {uploadError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-2 text-red-200 text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{uploadError}</p></div>}
            <div className="space-y-4">
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Unit / Chapter</label><input type="text" placeholder="e.g., Unit 1" value={uploadUnit} onChange={e => setUploadUnit(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Title</label><input type="text" placeholder="e.g., Chapter 1 Notes" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
              {!editingMaterialId ? (
                <div className="p-4 border-2 border-dashed border-white/20 rounded-xl text-center hover:border-primary/50 transition-colors relative">
                  <input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} accept=".pdf,.ppt,.pptx,image/*,video/*" disabled={isUploading} />
                  <label htmlFor="fileUpload" className={`cursor-pointer flex flex-col items-center ${isUploading ? 'pointer-events-none opacity-50' : ''}`}>
                    <Upload size={24} className="text-primary mb-2" />
                    <span className="text-sm text-white font-medium">{isUploading ? uploadStatus : 'Click to upload File'}</span>
                    <span className="text-xs text-gray-500 mt-1">PDF, PPTX, Images, Videos</span>
                  </label>
                </div>
              ) : (
                <button onClick={handleUpdateMaterial} disabled={isUploading} className="w-full bg-primary py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-colors">{isUploading ? 'Saving...' : 'Save Changes'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD PYQ MODAL */}
      {isPyqOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsPyqOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-bold text-white mb-6">Add Previous Year Question</h3>
            <form onSubmit={handleSavePyq} className="space-y-4">
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Question Topic / Title</label><input type="text" placeholder="e.g., Rotational Motion" value={pyqTitle} onChange={e => setPyqTitle(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" required /></div>
              <div className="row flex gap-4">
                <div className="flex-1"><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Year</label><input type="text" placeholder="2023" value={pyqYear} onChange={e => setPyqYear(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                <div className="flex-1"><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Marks</label><input type="number" placeholder="5" value={pyqMarks} onChange={e => setPyqMarks(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
              </div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Unit / Chapter</label><input type="text" placeholder="e.g., Unit 1" value={pyqUnit} onChange={e => setPyqUnit(e.target.value)} className="w-full bg-black/40 border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
              <div className="p-4 border-2 border-dashed border-white/20 rounded-xl text-center hover:border-primary/50 transition-colors relative">
                <input type="file" id="pyqFile" className="hidden" onChange={(e) => setPyqFile(e.target.files?.[0] || null)} accept=".pdf,image/*" disabled={isPyqSaving} />
                <label htmlFor="pyqFile" className="cursor-pointer flex flex-col items-center">
                  <Upload size={24} className="text-primary mb-2" />
                  <span className="text-sm text-white font-medium">{pyqFile ? pyqFile.name : 'Attach PDF / Image (Optional)'}</span>
                </label>
              </div>
              <button type="submit" disabled={isPyqSaving} className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl mt-4 transition-all disabled:opacity-50">{isPyqSaving ? 'Saving...' : 'Save PYQ'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
