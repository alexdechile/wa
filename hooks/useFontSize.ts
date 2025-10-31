import { useState, useEffect, useCallback } from 'react';

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const FONT_STEP = 2;
const DEFAULT_FONT_SIZE = 18;

export const useFontSize = () => {
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const storedSize = localStorage.getItem('comerzaFontSize');
      return storedSize ? parseInt(storedSize, 10) : DEFAULT_FONT_SIZE;
    } catch {
      return DEFAULT_FONT_SIZE;
    }
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    try {
      localStorage.setItem('comerzaFontSize', fontSize.toString());
    } catch (error) {
      console.error("Could not save font size to localStorage:", error);
    }
  }, [fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize(prevSize => Math.min(prevSize + FONT_STEP, MAX_FONT_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prevSize => Math.max(prevSize - FONT_STEP, MIN_FONT_SIZE));
  }, []);

  return { fontSize, increaseFontSize, decreaseFontSize };
};
