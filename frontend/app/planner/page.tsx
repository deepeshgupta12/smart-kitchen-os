'use client';

import React, { useEffect, useState } from 'react';
import { getMealPlan, getAllRecipes, addToPlan, getHealthStats } from '@/lib/api';
import { 
  ChevronLeft, 
  Plus, 
  Calendar as CalendarIcon,
  Sunrise,
  Sun,
  Moon,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import QuickAddModal from '@/components/QuickAddModal';
import HealthTracker from '@/components/HealthTracker';

export default function MealPlanner() {
  const [plans, setPlans] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [healthStats, setHealthStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ date: Date, name: string } | null>(null);

  // Today's date for the health tracker
  const todayStr = new Date().toISOString().split('T')[0];

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

  async function loadData() {
    try {
      const [planData, recipeData, healthData] = await Promise.all([
        getMealPlan(), 
        getAllRecipes(),
        getHealthStats(todayStr)
      ]);
      setPlans(planData);
      setRecipes(recipeData);
      setHealthStats(healthData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (date: Date, slotName: string) => {
    setActiveSlot({ date, name: slotName });
    setIsModalOpen(true);
  };

  const handleAddRecipeToPlan = async (recipeId: number) => {
    if (!activeSlot) return;
    try {
      const dateStr = activeSlot.date.toISOString().split('T')[0];
      await addToPlan(recipeId, dateStr, activeSlot.name);
      await loadData(); // Refresh both plan and health stats
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to add to plan.");
    }
  };

  const getPlannedDish = (date: Date, slot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return plans.find(p => p.planned_date === dateStr && p.meal_slot === slot);
  };

  if (loading && recipes.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
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
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-100 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Week View
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8">
        {/* Integrated Health Tracker (Shows stats for Today) */}
        <HealthTracker stats={healthStats} />

        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {weekDays.map((date, idx) => (
              <div key={idx} className="w-80 shrink-0">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <h3 className="text-xl font-black text-slate-900">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h3>
                </div>

                <div className="space-y-4">
                  {slots.map((slot) => {
                    const planned = getPlannedDish(date, slot.name);
                    return (
                      <div 
                        key={slot.name}
                        className={`min-h-35 rounded-4xl p-6 border-2 border-dashed transition-all relative group
                          ${planned ? 'bg-white border-slate-200 border-solid shadow-sm hover:shadow-md' : 'bg-slate-50 border-slate-200 hover:border-green-300 hover:bg-white'}`}
                      >
                        <div className="flex items-center gap-2 mb-4 opacity-60">
                          {slot.icon}
                          <span className="text-[10px] font-black uppercase tracking-widest">{slot.name}</span>
                        </div>

                        {planned ? (
                          <div className="animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="font-bold text-slate-900 leading-tight mb-2">{planned.dish.name}</h4>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold uppercase text-slate-500">
                              {planned.dish.cuisine}
                            </span>
                          </div>
                        ) : (
                          <button 
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 group-hover:text-green-500 transition-colors"
                            onClick={() => handleOpenModal(date, slot.name)}
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
      </div>

      <QuickAddModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipes={recipes}
        onSelect={handleAddRecipeToPlan}
        slotName={activeSlot?.name || ''}
        displayDate={activeSlot?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''}
      />
    </main>
  );
}