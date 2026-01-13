'use client';

import React, { useEffect, useState } from 'react';
import api, { 
  getMealPlan, 
  getAllRecipes, 
  addToPlan, 
  getHealthStats, 
  extractRecipe 
} from '@/lib/api';
import { 
  ChevronLeft, 
  Plus, 
  Calendar as CalendarIcon,
  Sunrise,
  Sun,
  Moon,
  Loader2,
  Sparkles,
  Wand2,
  X,
  Trash2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import QuickAddModal from '@/components/QuickAddModal';
import HealthTracker from '@/components/HealthTracker';

// Local API wrappers for enhancements
export const getSmartRecommendation = async (remainingCal: number, slot: string) => {
   // Updated to pass the selected slot to the backend
   const response = await api.get(`/recommend-me?slot=${slot}`);
   return response.data;
};

export const deleteMealPlanEntry = async (planId: number) => {
  const response = await api.delete(`/meal-planner/${planId}`);
  return response.data;
};

export default function MealPlanner() {
  const [plans, setPlans] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [healthStats, setHealthStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ date: Date, name: string } | null>(null);

  // Focus Date: Determines which day's health stats are shown in the tracker
  const [focusDate, setFocusDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Recommendation State
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [selectedSlotForAi, setSelectedSlotForAi] = useState("Dinner");
  const [isImporting, setIsImporting] = useState(false);

  const handleSmartSuggest = async () => {
    setSuggesting(true);
    setSuggestion(null);
    try {
      // Passes current health context and chosen slot
      const remaining = healthStats?.remaining_calories || 2000;
      const data = await getSmartRecommendation(remaining, selectedSlotForAi);
      setSuggestion(data.recommendation);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  const handleImportRecommendation = async () => {
    if (!suggestion) return;
    setIsImporting(true);
    try {
      // Extracts the dish name from the AI string (assuming format "Dish Name: Reason")
      const dishName = suggestion.split(':')[0].replace(/"/g, '').trim();
      const newRecipe = await extractRecipe(dishName);
      await addToPlan(newRecipe.id, focusDate, selectedSlotForAi);
      await loadData();
      setSuggestion(null);
    } catch (err) {
      alert("Failed to auto-schedule recommendation.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveMeal = async (planId: number) => {
    try {
      await deleteMealPlanEntry(planId);
      await loadData();
    } catch (err) {
      alert("Failed to remove meal.");
    }
  };

  async function loadData() {
    try {
      const [planData, recipeData, healthData] = await Promise.all([
        getMealPlan(), 
        getAllRecipes(),
        getHealthStats(focusDate)
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

  // Reload health stats whenever the focused date changes
  useEffect(() => {
    loadData();
  }, [focusDate]);

  const handleOpenModal = (date: Date, slotName: string) => {
    setActiveSlot({ date, name: slotName });
    setIsModalOpen(true);
  };

  const handleAddRecipeToPlan = async (recipeId: number) => {
    if (!activeSlot) return;
    try {
      const dateStr = activeSlot.date.toISOString().split('T')[0];
      await addToPlan(recipeId, dateStr, activeSlot.name);
      await loadData();
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
          {focusDate === new Date().toISOString().split('T')[0] ? 'Focus: Today' : `Focus: ${focusDate}`}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Multi-Date Health Tracker */}
        <HealthTracker stats={healthStats} />

        {/* AI Recommendation Panel */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm mb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Smart Gap-Filler
              </h3>
              <p className="text-slate-500 text-sm font-medium">Select a slot and let AI suggest a meal that fits your remaining {healthStats?.remaining_calories || 0} calories.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={selectedSlotForAi}
                onChange={(e) => setSelectedSlotForAi(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {slots.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <button 
                onClick={handleSmartSuggest}
                disabled={suggesting}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-600 transition-all disabled:bg-slate-200"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Get Suggestion
              </button>
            </div>
          </div>

          {suggestion && (
            <div className="mt-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-indigo-900 font-medium leading-relaxed italic">
                  &quot;{suggestion}&quot;
                </p>
                <div className="flex gap-2">
                   <button 
                    onClick={handleImportRecommendation}
                    disabled={isImporting}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 whitespace-nowrap"
                  >
                    {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Import & Schedule
                  </button>
                  <button onClick={() => setSuggestion(null)} className="text-indigo-300 hover:text-indigo-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Grid */}
        <div className="overflow-x-auto pb-8">
          <div className="flex gap-6 min-w-max">
            {weekDays.map((date, idx) => {
              const dateKey = date.toISOString().split('T')[0];
              const isFocused = focusDate === dateKey;

              return (
                <div key={idx} className="w-80 shrink-0">
                  {/* Day Header - Clickable to update Focus Date */}
                  <button 
                    onClick={() => setFocusDate(dateKey)}
                    className={`w-full text-left bg-white rounded-3xl p-6 border transition-all duration-300 mb-6
                      ${isFocused ? 'border-green-500 shadow-lg shadow-green-100 ring-2 ring-green-50' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isFocused ? 'text-green-600' : 'text-slate-400'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                    <h3 className="text-xl font-black text-slate-900">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                  </button>

                  <div className="space-y-4">
                    {slots.map((slot) => {
                      const planned = getPlannedDish(date, slot.name);
                      return (
                        <div 
                          key={slot.name}
                          className={`min-h-40 rounded-[2.5rem] p-6 border-2 transition-all relative group
                            ${planned 
                              ? 'bg-white border-slate-200 border-solid shadow-sm hover:shadow-md' 
                              : 'bg-slate-50 border-slate-200 border-dashed hover:border-green-300 hover:bg-white'}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 opacity-60">
                              {slot.icon}
                              <span className="text-[10px] font-black uppercase tracking-widest">{slot.name}</span>
                            </div>
                            {planned && (
                              <button 
                                onClick={() => handleRemoveMeal(planned.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {planned ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                              <h4 className="font-bold text-slate-900 leading-tight mb-3 text-lg">{planned.dish.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-bold uppercase text-slate-500">
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
              );
            })}
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