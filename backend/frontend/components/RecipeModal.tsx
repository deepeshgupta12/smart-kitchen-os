'use client';

import React, { useState } from 'react';
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
      setError(err.response?.data?.detail || 'Something went wrong while extracting the recipe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-green-600 w-5 h-5" />
            <h3 className="text-lg font-bold">AI Recipe Importer</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Paste a recipe URL or simply type a dish name like Classic Butter Chicken.
          </p>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. https://cooking.nytimes.com/... or 'Palak Paneer'"
            className="w-full h-32 p-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
            required
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-gray-300 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing with AI...
              </>
            ) : (
              'Extract Recipe'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}