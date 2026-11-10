import React from 'react';
import { useTheme, UNIVERSES, type Universe } from '../context/ThemeContext';
import { User, Shield, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Customization() {
  const { universe, setUniverse, character, setCharacter } = useTheme();
  const activeUniverseData = UNIVERSES[universe];

  return (
    <div className="p-8 h-full overflow-y-auto pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Customization</h2>
        <p className="text-gray-400 text-sm">Choose your universe and select your character designation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Universe Selection */}
        <div className="lg:col-span-1">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Compass size={16} /> Select Universe
            </h3>
            <div className="space-y-3">
              {(Object.keys(UNIVERSES) as Universe[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUniverse(u)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    universe === u 
                      ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="font-bold">{u}</span>
                  {universe === u && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Character Selection */}
        <div className="lg:col-span-2">
          <div className="glass p-6 rounded-2xl h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={16} /> Character Designation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeUniverseData.characters.map((char) => {
                const isSelected = character.name === char.name;
                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={char.name}
                    onClick={() => setCharacter(char)}
                    className={`p-6 rounded-2xl border flex flex-col items-center text-center transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-b from-primary/20 to-transparent border-primary shadow-[0_0_30px_rgba(var(--color-primary),0.2)]' 
                        : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${
                      isSelected ? 'bg-primary/20 shadow-inner' : 'bg-white/5'
                    }`}>
                      {char.avatar}
                    </div>
                    <h4 className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {char.name}
                    </h4>
                    <p className={`text-xs mt-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                      {char.title}
                    </p>
                    
                    {isSelected && (
                      <div className="mt-4 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Shield size={10} /> Active Designation
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
