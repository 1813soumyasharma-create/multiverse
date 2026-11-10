import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="flex items-center justify-center h-screen w-full bg-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-primary),0.15)_0,transparent_100%)]"></div>
      
      <div className="glass p-10 rounded-3xl w-full max-w-md relative z-10 text-center border border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-black text-3xl mx-auto mb-6 shadow-lg shadow-primary/20">
          M
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">The Multiverse</h1>
        <p className="text-gray-400 mb-8">Study. Explore. Excel.</p>
        
        <button 
          onClick={login}
          className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all"
        >
          <LogIn size={20} /> Sign in with Google
        </button>
      </div>
    </div>
  );
}
