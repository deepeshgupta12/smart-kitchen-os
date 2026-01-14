"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Target, Save, Weight, Ruler, Edit3, Activity } from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function HealthDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [healthStats, setHealthStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [pRes, sRes] = await Promise.all([axios.get(`${API_BASE}/profile`), axios.get(`${API_BASE}/health-stats/${today}`)]);
      setProfile(pRes.data);
      setFormData(pRes.data);
      setHealthStats(sRes.data);
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async () => {
    await axios.put(`${API_BASE}/profile`, formData);
    setIsEditing(false);
    fetchData();
  };

  const getProgress = (act: number, goal: any) => {
    const target = typeof goal === 'string' ? parseInt(goal.replace('g', '')) : goal;
    return Math.min(Math.round((act / (target || 1)) * 100), 100);
  };

  if (!profile || !healthStats) return <div className="p-10 text-center animate-pulse">Loading Health Intel...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Health Dashboard</h2>
          <p className="text-slate-500">Personalized Fitness Metrics</p>
        </div>
        <button onClick={() => isEditing ? handleUpdate() : setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white">
          {isEditing ? <><Save size={18}/> Save</> : <><Edit3 size={18}/> Update Metrics</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-4">Profile Stats</div>
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={formData.weight_kg ?? ""} 
                    onChange={(e) => setFormData({...formData, weight_kg: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-slate-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Activity Level</label>
                    <select value={formData.activity_level} onChange={(e) => setFormData({...formData, activity_level: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-none">
                        <option value="sedentary">Sedentary</option>
                        <option value="moderate">Moderate</option>
                        <option value="active">Active</option>
                    </select>
                </div>
              </>
            ) : (
              <>
                <Metric label="Weight" val={`${profile.weight_kg}kg`} icon={<Weight size={18}/>} />
                <Metric label="Height" val={`${profile.height_cm}cm`} icon={<Ruler size={18}/>} />
                <Metric label="Activity" val={profile.activity_level} icon={<Activity size={18}/>} />
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-8">Daily Nutrition Progress</div>
          <div className="space-y-6">
            <ProgressBar label="Calories" act={healthStats.actual.calories} goal={healthStats.goals.daily_calorie_goal} />
            <div className="grid grid-cols-3 gap-4">
              <Macro act={healthStats.actual.protein} goal={healthStats.goals.daily_protein_goal} label="Protein" color="bg-emerald-500" />
              <Macro act={healthStats.actual.carbs} goal={healthStats.goals.daily_carbs_goal} label="Carbs" color="bg-amber-500" />
              <Macro act={healthStats.actual.fats} goal={healthStats.goals.daily_fats_goal} label="Fats" color="bg-rose-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, val, icon }: any) {
    return <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
        <span className="flex items-center gap-2 text-slate-500">{icon}{label}</span>
        <span className="font-bold text-slate-800 capitalize">{val}</span>
    </div>;
}

function ProgressBar({ label, act, goal }: any) {
    const progress = Math.min(Math.round((act / (goal || 1)) * 100), 100);
    return <div className="space-y-2">
        <div className="flex justify-between font-bold text-slate-700"><span>{label}</span><span>{act} / {goal} kcal</span></div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${progress}%`}} /></div>
    </div>;
}

function Macro({ act, goal, label, color }: any) {
    const progress = Math.min(Math.round((act / (parseInt(goal) || 1)) * 100), 100);
    return <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="text-[10px] font-black text-slate-400 uppercase">{label}</div>
        <div className="font-bold text-slate-800 mb-2">{act}g <span className="text-slate-400 text-xs">/ {goal}</span></div>
        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{width: `${progress}%`}} /></div>
    </div>;
}