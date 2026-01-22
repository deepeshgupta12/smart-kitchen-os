"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Trash2, Eye, Database } from 'lucide-react';
// Step 3: Importing DishDetail to handle the expanded entity view
import DishDetail from './DishDetail'; 

const API_BASE = "http://localhost:8000";

export default function DishManager() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // NEW: State to track which dish is being viewed in the CMS
  const [selectedDish, setSelectedDish] = useState<any>(null); 

  useEffect(() => { fetchDishes(); }, []);

  const fetchDishes = async () => {
    try {
      // Fetching all dishes from the persistent cache
      const res = await axios.get(`${API_BASE}/recipes`);
      setDishes(res.data);
    } catch (err) { console.error("CMS Load Error", err); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Permanently remove this asset from the CMS cache?")) {
      try {
        await axios.delete(`${API_BASE}/cms/recipe/${id}`);
        fetchDishes(); // Refresh list after deletion
      } catch (err) {
        console.error("Delete Error", err);
      }
    }
  };

  const filtered = dishes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Step 3: Conditional Rendering Logic
  // If a dish is selected, show the Detail View instead of the table
  if (selectedDish) {
    return <DishDetail dish={selectedDish} onBack={() => setSelectedDish(null)} />;
  }

  return (
    <div className="bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Search by name or cuisine..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Assets Stored: {dishes.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-50">
              <th className="px-6 py-5">Culinary Asset</th>
              <th className="px-6 py-5">KCAL</th>
              <th className="px-6 py-5">Macros (P / C / F)</th>
              <th className="px-6 py-5">Complexity</th>
              <th className="px-6 py-5 text-right">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((dish) => (
              <tr key={dish.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <img src={dish.thumbnail_url} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                    <div>
                      <div className="font-bold text-slate-800">{dish.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{dish.cuisine}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="font-black text-slate-700">{dish.nutrition?.calories || 0}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-3">
                    <MacroBadge label="P" val={dish.nutrition?.protein} color="text-emerald-600 bg-emerald-50" />
                    <MacroBadge label="C" val={dish.nutrition?.carbs} color="text-amber-600 bg-amber-50" />
                    <MacroBadge label="F" val={dish.nutrition?.fats} color="text-rose-600 bg-rose-50" />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{dish.prep_steps?.length || 0} Prep Steps</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{dish.ingredients?.length || 0} Ingredients</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    {/* FIXED: OnClick now triggers the detailed view with full entity mapping */}
                    <button 
                      onClick={() => setSelectedDish(dish)}
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Eye size={18}/>
                    </button>
                    <button 
                      onClick={() => handleDelete(dish.id)}
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MacroBadge({ label, val, color }: any) {
  return (
    <div className={`px-2 py-1 rounded-md font-black text-[10px] flex gap-1 ${color}`}>
      <span>{label}:</span>
      <span>{val || '0g'}</span>
    </div>
  );
}