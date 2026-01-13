'use client';

import React, { useEffect, useState } from 'react';
import { getMealPlan, getAllRecipes, addToPlan } from '@/lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ChefHat, 
  Calendar as CalendarIcon,
  UtensilsCrossed,
  Sunrise,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';

export default function MealPlanner() {
  const [plans, setPlans] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate the next 7 days starting from today
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const slots = [
    { name: 'Breakfast', icon: <Sunrise className="w-4 h-4 text-orange-400" /> },
    { name: 'Lunch', icon: <Sun className="w-4 h-4 text-yellow-500" /> },
    { name: 'Dinner', icon: <Moon className="w-4 h-4 text-indigo-400" /> }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [planData, recipeData] = await Promise.all([getMealPlan(), getAllRecipes()]);
        setPlans(planData);
        setRecipes(recipeData);
      } catch (err) {
        console.error("Error loading planner data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to find if a dish is planned for a specific day and slot
  const getPlannedDish = (date: Date, slot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return plans.find(p => p.planned_date === dateStr && p.meal_slot === slot);
  };

  if (loading) return <div className="p-20 text-center font-bold">Initializing Planner...</div>;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <nav className="bg-white border-b px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Weekly Meal Planner</h1>
            <p className="text-slate-500 text-sm font-medium">Schedule your culinary week</p>
          </div>
        </div>
        <div className="flex gap-3">
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Jan 13 - Jan 20
            </div>
        </div>
      </nav>

      {/* 7-Day Grid */}
      <div className="max-w-[1600px] mx-auto p-8 overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-4">
          {weekDays.map((date, idx) => (
            <div key={idx} className="w-80 flex-shrink-0">
              {/* Day Header */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <h3 className="text-xl font-black text-slate-900">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h3>
              </div>

              {/* Slots for the day */}
              <div className="space-y-4">
                {slots.map((slot) => {
                  const planned = getPlannedDish(date, slot.name);
                  return (
                    <div 
                      key={slot.name}
                      className={`min-h-[140px] rounded-[2rem] p-6 border-2 border-dashed transition-all relative group
                        ${planned ? 'bg-white border-slate-200 border-solid shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-green-300 hover:bg-green-50/30'}`}
                    >
                      <div className="flex items-center gap-2 mb-4 opacity-60">
                        {slot.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest">{slot.name}</span>
                      </div>

                      {planned ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                          <h4 className="font-bold text-slate-900 leading-tight mb-2">{planned.dish.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold uppercase text-slate-500">
                              {planned.dish.cuisine}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {planned.dish.nutrition?.calories} kcal
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 group-hover:text-green-500 transition-colors"
                          onClick={() => {/* We will add the Quick-Add Modal in the next step */}}
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase">Schedule</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}