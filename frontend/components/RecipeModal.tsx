'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Wand2 } from 'lucide-react';
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

  // Lock scroll when modal is active
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
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
      console.error("Extraction Error:", err);
      setError(err.response?.data?.detail || 'AI Extraction failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl">
              <Sparkles className="text-green-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Recipe Importer</h3>
              <p className="text-xs text-slate-500 font-medium">Powered by GPT-4o Culinary Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <label className="block text-sm font-bold text-slate-700 mb-3">
            What are we cooking today?
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. 'Butter Chicken' or paste a URL from your favorite food blog..."
            className="w-full h-40 p-5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all resize-none text-base leading-relaxed"
            required
            autoFocus
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex gap-2">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-slate-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Recipe...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Extract Recipe
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}