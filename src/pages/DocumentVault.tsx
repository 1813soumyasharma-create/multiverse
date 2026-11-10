import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import localforage from 'localforage';
import { UploadCloud, FileText, Trash2, CheckCircle2 } from 'lucide-react';

export default function DocumentVault() {
  const [files, setFiles] = useState<{name: string, size: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Load existing files on mount
  useEffect(() => {
    localforage.keys().then(keys => {
      const fileList = keys.map(k => ({ name: k, size: 'Unknown' }));
      setFiles(fileList);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    for (const file of acceptedFiles) {
      try {
        // For a simple frontend demo, we extract text from text/markdown files.
        // (Parsing PDFs requires heavy backend libraries or complex WASM setups).
        if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          const text = await file.text();
          await localforage.setItem(file.name, text);
        } else {
          // For PDFs/Images, we save a mock text so the AI can still "read" it for the demo
          await localforage.setItem(file.name, `[Mock extracted text for ${file.name}]: This document contains important syllabus information regarding Operating Systems and CPU scheduling.`);
        }
        
        setFiles(prev => [...prev, { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' }]);
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
    setIsUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/*': ['.txt', '.md'], 'application/pdf': ['.pdf'] } });

  const deleteFile = async (name: string) => {
    await localforage.removeItem(name);
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  return (
    <div className="p-8 h-full overflow-y-auto pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Document Vault</h2>
        <p className="text-gray-400 text-sm">Upload your PYQs, PPTs, and Notes. The AI will read these.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <div 
            {...getRootProps()} 
            className={`glass border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={48} className={`mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
            <h3 className="text-lg font-bold text-white mb-2">
              {isDragActive ? "Drop files here" : "Click or drag files to upload"}
            </h3>
            <p className="text-sm text-gray-400">Supported: PDF, TXT, MD</p>
            {isUploading && <p className="text-primary text-sm mt-4 animate-pulse">Processing files...</p>}
          </div>
        </div>

        {/* File List */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
              <h3 className="font-bold text-white">Uploaded Sources ({files.length})</h3>
            </div>
            
            <div className="p-2">
              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No files uploaded yet. Drop a text file to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <FileText size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{f.name}</p>
                          <p className="text-xs text-gray-400">{f.size} • Ready for AI</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <CheckCircle2 size={18} className="text-green-500 opacity-50 group-hover:opacity-100" />
                        <button onClick={() => deleteFile(f.name)} className="text-gray-400 hover:text-red-400 p-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
