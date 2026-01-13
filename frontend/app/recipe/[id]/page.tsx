'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRecipeById } from '@/lib/api';
import { 
  ArrowLeft, 
  Flame, 
  CheckCircle2, 
  Utensils, 
  ChefHat, 
  Scale, 
  Zap,
  Dna
} from 'lucide-react';

export default function RecipeDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRecipeById(id as string);
        setRecipe(data);
      } catch (err) {
        console.error("Error loading recipe:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-slate-600">Loading your culinary data...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-slate-500">Recipe not found.</p>
      </div>
    );
  }

  // Dynamic Image Fallback based on Dish Name
  const imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1600&h=900`;

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Dynamic Hero Section */}
      <div className="relative h-[50vh] w-full">
        <img 
          src={imageUrl} 
          alt={recipe.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        
        <button 
          onClick={() => router.push('/')}
          className="absolute top-8 left-8 bg-white shadow-xl p-3 rounded-full text-slate-900 hover:scale-110 transition-all z-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-10 max-w-7xl mx-auto">
          <div className="flex gap-2 mb-4">
            <span className="bg-green-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
              {recipe.cuisine}
            </span>
            <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
              {recipe.meal_type}
            </span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4">
            {recipe.name}
          </h1>
          <p className="text-slate-600 text-xl max-w-3xl leading-relaxed">
            {recipe.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Column: Ingredients (Locked Scope: Value + Measure) */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-100 rounded-lg">
              <Utensils className="text-green-600 w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Ingredients</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-16">
            {recipe.ingredients.map((ing: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-green-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="font-bold text-slate-700">{ing.name}</span>
                </div>
                <div className="text-slate-500 font-medium bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                  {ing.quantity} {ing.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Preparation Steps */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChefHat className="text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Instructions</h2>
          </div>
          
          <div className="space-y-6">
            {recipe.prep_steps.map((step: string, idx: number) => (
              <div key={idx} className="flex gap-6 p-6 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-200">
                  {idx + 1}
                </span>
                <p className="text-slate-600 text-lg leading-relaxed pt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Nutrition & Smart Insights */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Nutrition Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="w-32 h-32" />
            </div>
            
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Scale className="text-green-400" /> Nutritional Breakdown
            </h3>
            
            <div className="space-y-8 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Calories</span>
                <span className="text-5xl font-black text-green-400 leading-none">
                  {recipe.nutrition.calories} <span className="text-lg text-white">kcal</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-black">Protein</div>
                  <div className="text-xl font-black">{recipe.nutrition.protein}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-black">Carbs</div>
                  <div className="text-xl font-black">{recipe.nutrition.carbs}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-black">Fats</div>
                  <div className="text-xl font-black">{recipe.nutrition.fats}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Suggestion (Locked Scope: Pairings) */}
          <div className="bg-green-50 rounded-[2rem] p-8 border border-green-100">
            <h3 className="font-black text-green-900 mb-4 flex items-center gap-2 uppercase tracking-tight text-sm">
              <CheckCircle2 className="w-5 h-5" /> Chef's Pairing Suggestion
            </h3>
            <p className="text-green-800 text-lg font-medium leading-relaxed">
              This {recipe.cuisine} classic pairs beautifully with fresh herbs or steamed jasmine rice. 
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}