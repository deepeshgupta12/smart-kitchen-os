'use client';

import React, { useState } from 'react';
import { X, Search, Utensils, Check } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: any[];
  onSelect: (recipeId: number) => void;
  slotName: string;
  displayDate: string;
}

export default function QuickAddModal({ isOpen, onClose, recipes, onSelect, slotName, displayDate }: QuickAddModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Schedule {slotName}</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{displayDate}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search your collection..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(recipe.id)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-green-50 border border-transparent hover:border-green-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-green-100">
                      <Utensils className="w-4 h-4 text-slate-400 group-hover:text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">{recipe.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{recipe.cuisine}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-400 font-medium">No recipes found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}