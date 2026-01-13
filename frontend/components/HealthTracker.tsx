'use client';

import React from 'react';
import { Flame, Target, Trophy } from 'lucide-react';

export default function HealthTracker({ stats }: { stats: any }) {
  if (!stats) return null;

  const progress = (stats.actual.calories / stats.goals.calories) * 100;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="bg-orange-100 p-4 rounded-2xl text-orange-600">
          <Flame className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Daily Calories</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.actual.calories}</span>
            <span className="text-slate-400 font-bold">/ {stats.goals.calories} kcal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-12">
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-1000" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Protein: {stats.actual.protein}g</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Carbs: {stats.actual.carbs}g</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fats: {stats.actual.fats}g</span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Remaining</p>
        <p className="text-2xl font-black text-slate-900">{stats.remaining_calories} kcal</p>
      </div>
    </div>
  );
}