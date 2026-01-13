'use client';


import React, { useState } from 'react';
import { Search, ChefHat, ShoppingBasket, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ChefHat className="text-green-600 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900">SmartKitchen OS</h1>
        </div>
        
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for recipes or ingredients..." 
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-green-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 text-gray-600">
          <button className="flex flex-col items-center hover:text-green-600 transition-colors">
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">Planner</span>
          </button>
          <button className="flex flex-col items-center hover:text-green-600 transition-colors">
            <ShoppingBasket className="w-6 h-6" />
            <span className="text-xs mt-1">Cart</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Your Recipe Discovery</h2>
          <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-all shadow-sm">
            + New Recipe
          </button>
        </div>

        {/* Empty State / Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-400">
             <p>No recipes extracted yet.</p>
             <p className="text-sm">Add your first recipe to see the magic.</p>
          </div>
        </div>
      </section>
    </main>
  );
}