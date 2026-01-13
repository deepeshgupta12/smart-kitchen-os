'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { extractRecipe } from '@/lib/api';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function RecipeModal({ isOpen, onClose, onSuccess }: RecipeModalProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await extractRecipe(input);
      onSuccess(data);
      setInput('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('AI extraction failed. Check backend console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Sparkles className="text-green-600 w-5 h-5" />
            <h3 className="text-lg font-bold text-gray-900">AI Recipe Importer</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-white">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. 'Palak Paneer' or a recipe URL"
            className="w-full h-32 p-4 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
            required
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-gray-400 transition-all shadow-lg"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Working...</> : 'Extract Recipe'}
          </button>
        </form>
      </div>
    </div>
  );
}