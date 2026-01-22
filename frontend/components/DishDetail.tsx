"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Save, RefreshCcw, Edit2, X, ChevronLeft } from 'lucide-react';

export default function DishDetail({ dish, onBack }: { dish: any, onBack: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(dish);

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:8000/cms/recipes/${dish.id}`, editData);
      setIsEditing(false);
      alert("Dish updated successfully in CMS.");
    } catch (err) { console.error("Update failed", err); }
  };

  const handleRegenerate = async () => {
    if (confirm("This will overwrite your manual edits with fresh AI content. Proceed?")) {
      const res = await axios.post(`http://localhost:8000/cms/recipes/${dish.id}/regenerate`);
      setEditData(res.data);
      alert("Dish regenerated via AI.");
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold"><ChevronLeft size={20}/> Back to CMS</button>
        <div className="flex gap-3">
          <button onClick={handleRegenerate} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 transition-all">
            <RefreshCcw size={18}/> Regenerate
          </button>
          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white transition-all ${isEditing ? 'bg-green-600' : 'bg-indigo-600'}`}>
            {isEditing ? <><Save size={18}/> Save Changes</> : <><Edit2 size={18}/> Edit Asset</>}
          </button>
        </div>
      </div>

      <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nutrition (KCAL, P, C, F)</h3>
          <div className="grid grid-cols-2 gap-4">
             {['calories', 'protein', 'carbs', 'fats'].map((key) => (
               <div key={key} className="bg-slate-50 p-4 rounded-2xl">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">{key}</label>
                 {isEditing ? (
                   <input 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 mt-1"
                     value={editData.nutrition[key]} 
                     onChange={(e) => setEditData({...editData, nutrition: {...editData.nutrition, [key]: e.target.value}})}
                   />
                 ) : <div className="text-xl font-black text-slate-800">{editData.nutrition[key]}</div>}
               </div>
             ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparation Steps</h3>
          <div className="space-y-4">
            {editData.prep_steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black">{i+1}</span>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                    value={step} 
                    onChange={(e) => {
                      const newSteps = [...editData.prep_steps];
                      newSteps[i] = e.target.value;
                      setEditData({...editData, prep_steps: newSteps});
                    }}
                  />
                ) : <p className="text-slate-600 text-sm leading-relaxed">{step}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}