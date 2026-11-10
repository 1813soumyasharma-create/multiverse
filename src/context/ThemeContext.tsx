import React, { createContext, useContext, useState, useEffect } from 'react';

export type Universe = 'Avengers' | 'Hunger Games' | 'X-Men';

export const UNIVERSES = {
  'Avengers': {
    primary: '226 54 54', // Stark Red
    secondary: '245 197 66', // Iron Man Gold
    bg: '10 10 12',
    panel: '18 18 22',
    border: '39 39 42',
    characters: [
      { name: 'Iron Man', title: 'Genius, Billionaire, Scholar', avatar: '🤖', bgImage: 'url("/ironman.jpg")' },
      { name: 'Captain America', title: 'The First Avenger', avatar: '🛡️', bgImage: 'url("/captainamerica.jpg")' },
      { name: 'Thor', title: 'God of Thunder', avatar: '🔨', bgImage: 'url("/thor.webp")' },
      { name: 'Black Widow', title: 'Master Spy', avatar: '🕷️', bgImage: 'url("/blackwidow.png")' }
    ]
  },
  'Hunger Games': {
    primary: '255 107 26', // Katniss Orange
    secondary: '63 166 42', // District 12 Green
    bg: '11 18 16', // Deep Forest Dark
    panel: '18 32 27',
    border: '30 53 44',
    characters: [
      { name: 'Katniss Everdeen', title: 'The Girl on Fire', avatar: '🏹', bgImage: 'url("/katniss.jpg")' },
      { name: 'Peeta Mellark', title: 'The Baker', avatar: '🍞', bgImage: 'url("/peeta.jpg")' },
      { name: 'Haymitch Abernathy', title: 'The Mentor', avatar: '🍷', bgImage: 'url("/haymitch.jpg")' },
      { name: 'Lucy Gray Baird', title: 'The Songbird', avatar: '🐍', bgImage: 'url("/lucygray.jpeg")' }
    ]
  },
  'X-Men': {
    primary: '245 217 10', // Wolverine Yellow
    secondary: '138 106 255', // Jean Grey Purple
    bg: '8 11 18', // Xavier Institute Dark
    panel: '18 24 38',
    border: '42 54 84',
    characters: [
      { name: 'Professor X', title: 'The Telepath', avatar: '🧠', bgImage: 'url("/professorx.jpg")' }, 
      { name: 'Jean Grey', title: 'The Phoenix', avatar: '🔥', bgImage: 'url("/jean.jpg")' },
      { name: 'Cyclops', title: 'The Tactician', avatar: '👁️', bgImage: 'url("/cyclops.webp")' },
      { name: 'Quicksilver', title: 'The Speedster', avatar: '⚡', bgImage: 'url("/quicksilver.webp")' }
    ]
  }
};

export interface Character {
  name: string;
  title: string;
  avatar: string;
  bgImage: string;
}

interface ThemeContextType {
  universe: Universe;
  setUniverse: (u: Universe) => void;
  character: Character;
  setCharacter: (c: Character) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [universe, setUniverse] = useState<Universe>('Avengers');
  const [character, setCharacter] = useState<Character>(UNIVERSES['Avengers'].characters[0]);

  useEffect(() => {
    const theme = UNIVERSES[universe];
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-bg', theme.bg);
    root.style.setProperty('--color-panel', theme.panel);
    root.style.setProperty('--color-border', theme.border);
    
    // Auto-switch character if the universe changes and the current character doesn't belong
    if (!theme.characters.find(c => c.name === character.name)) {
      setCharacter(theme.characters[0]);
    }

    // Set the background image based on the active character
    const activeChar = theme.characters.find(c => c.name === character.name) || theme.characters[0];
    if (activeChar && activeChar.bgImage) {
      root.style.setProperty('--bg-image', activeChar.bgImage);
    }
  }, [universe, character.name]);

  return (
    <ThemeContext.Provider value={{ universe, setUniverse, character, setCharacter }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
