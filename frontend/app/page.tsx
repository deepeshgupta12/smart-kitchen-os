'use client';

import React, { useState } from 'react';
import { Search, ChefHat, ShoppingBasket, Calendar, Plus } from 'lucide-react';
import RecipeModal from '@/components/RecipeModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestRecipe, setLatestRecipe] = useState<any>(null);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-[50]">
        <div className="flex items-center gap-2">
          <div className="bg-green-600 p-1.5 rounded-lg">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SmartKitchen OS</h1>
        </div>
        
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for recipes..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 text-slate-600">
          <button className="flex flex-col items-center hover:text-green-600 transition-colors">
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold mt-1">Planner</span>
          </button>
          <button className="flex flex-col items-center hover:text-green-600 transition-colors">
            <ShoppingBasket className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold mt-1">Cart</span>
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Recipe Discovery</h2>
            <p className="text-slate-500 mt-1">AI-powered meal planning and structured insights.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Recipe
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestRecipe ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-slate-100 flex items-center justify-center relative">
                <ChefHat className="w-12 h-12 text-slate-300" />
                <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-slate-700">
                  {latestRecipe?.cuisine}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{latestRecipe?.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                  {latestRecipe?.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Calories</span>
                    <span className="font-bold text-slate-700">{latestRecipe?.nutrition?.calories || 0} kcal</span>
                  </div>
                  <button className="text-green-600 font-bold text-sm hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl h-80 flex flex-col items-center justify-center text-slate-400 bg-white/50">
               <Plus className="w-8 h-8 mb-4" />
               <p className="font-bold text-slate-600">No recipes in your collection</p>
            </div>
          )}
        </div>
      </section>

      <RecipeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(data) => setLatestRecipe(data)}
      />
    </main>
  );
}