'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Added User icon to the imports below
import { Search, ChefHat, ShoppingBasket, Calendar, Plus, Sparkles, ArrowRight, ThermometerSnowflake, User, Database } from 'lucide-react';
import RecipeModal from '@/components/RecipeModal';
import { getAllRecipes } from '@/lib/api';
import { Camera, Upload } from 'lucide-react'; // Added camera icons
import { scanImage } from '@/lib/api';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await getAllRecipes();
        setRecipes(data);
      } catch (err) {
        console.error("Failed to fetch recipes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  const handleExtractionSuccess = (newRecipe: any) => {
    setRecipes((prev) => [newRecipe, ...prev]);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setLoading(true);
    try {
      const result = await scanImage(e.target.files[0], 'dish');
      if (result.dish) {
        setRecipes(prev => [result.dish, ...prev]);
        alert(`Vision recognized: ${result.dish.name}`);
      }
    } catch (err) {
      console.error("Scan error", err);
    } finally {
      setLoading(false);
    }
  }
};

// Return UI update:
<div className="flex gap-4">
  <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95">
    <Plus className="w-5 h-5" />
    New Recipe
  </button>
</div>

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
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

        <Link href="/cms" className="flex flex-col items-center hover:text-green-600 transition-colors">
        <Database className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold mt-1">CMS</span>
        </Link>
        <div className="flex items-center gap-6 text-slate-600">
          <Link href="/pantry" className="flex flex-col items-center hover:text-green-600 transition-colors">
            <ThermometerSnowflake className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold mt-1">Pantry</span>
          </Link>
          <Link href="/planner" className="flex flex-col items-center hover:text-green-600 transition-colors">
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold mt-1">Planner</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center hover:text-green-600 transition-colors">
            <ShoppingBasket className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold mt-1">Cart</span>
          </Link>
          {/* NEW: V6 Profile Navigation Link */}
          <Link href="/profile" className="flex flex-col items-center hover:text-green-600 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold mt-1">Profile</span>
          </Link>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <section className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recipe Discovery</h2>
            <p className="text-slate-500 mt-1 font-medium">Manage your smart kitchen with AI-driven insights.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <label className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
            <Camera className="w-5 h-5" />
            Scan Dish
            <input type="file" accept="image/*" className="hidden" onChange={handleScan} />
            </label>
            New Recipe
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div key="loader" className="col-span-full py-20 text-center">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            </div>
          ) : recipes.length > 0 ? (
            recipes.map((recipe) => (
              <div key={recipe.id} className="group bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                <img 
                  src={recipe.thumbnail_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?sig=${recipe.id}`} 
                  alt={recipe.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-sm">
                    {recipe.cuisine}
                  </div>
                </div>

                <div className="p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-green-50 text-green-700 rounded-lg uppercase tracking-tight">
                      {recipe.meal_type && recipe.meal_type !== "Meal" ? recipe.meal_type.split(',')[0] : 'Dish'}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase">AI Analyzed</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-green-600 transition-colors">
                    {recipe.name}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-8 leading-relaxed font-medium">
                    {recipe.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Calories</span>
                      <span className="font-black text-slate-800 text-lg">
                        {recipe.nutrition?.calories || 0} <span className="text-xs font-bold text-slate-400">kcal</span>
                      </span>
                    </div>
                    
                    <Link href={`/recipe/${recipe.id}`}>
                      <button className="bg-slate-900 text-white p-3 rounded-xl hover:bg-green-600 transition-all shadow-lg">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div key="empty" className="col-span-full border-2 border-dashed border-slate-200 rounded-[3rem] h-80 flex flex-col items-center justify-center text-slate-400">
               <p className="font-bold">No recipes yet.</p>
            </div>
          )}
        </div>
      </section>

      <RecipeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleExtractionSuccess}
      />
    </main>
  );
}