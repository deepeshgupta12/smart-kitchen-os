"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Activity, Target, CheckCircle, 
  Save, Weight, Ruler, Edit3, Heart 
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function HealthDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [healthStats, setHealthStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [profileRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/profile`),
        axios.get(`${API_BASE}/health-stats/${today}`)
      ]);
      setProfile(profileRes.data);
      setFormData(profileRes.data);
      setHealthStats(statsRes.data);
    } catch (err) {
      console.error("Error loading health data:", err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await axios.put(`${API_BASE}/profile`, formData);
      setProfile(res.data);
      setIsEditing(false);
      // Refresh to see newly calculated goals
      fetchData();
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const getProgress = (actual: number, goal: string | number) => {
    const target = typeof goal === 'string' ? parseInt(goal.replace('g', '')) : goal;
    return Math.min(Math.round((actual / target) * 100), 100);
  };

  if (!profile || !healthStats) return <div className="p-10 text-center animate-pulse">Initializing Health Intelligence...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Health Intelligence</h2>
          <p className="text-slate-500">V6: Personalized Nutrition Tracking</p>
        </div>
        <button 
          onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            isEditing ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isEditing ? <><Save size={18}/> Save Profile</> : <><Edit3 size={18}/> Edit Metrics</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physical Stats Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <User size={14}/> Physical Profile
          </div>
          
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400">Weight (kg)</label>
                  <input type="number" value={formData.weight_kg} onChange={(e) => setFormData({...formData, weight_kg: parseFloat(e.target.value)})} className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Activity Level</label>
                  <select value={formData.activity_level} onChange={(e) => setFormData({...formData, activity_level: e.target.value})} className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-500">
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <MetricBox icon={<Weight size={18}/>} label="Weight" value={`${profile.weight_kg}kg`} />
                <MetricBox icon={<Ruler size={18}/>} label="Height" value={`${profile.height_cm}cm`} />
                <MetricBox icon={<Activity size={18}/>} label="Activity" value={profile.activity_level} capitalize />
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <Target size={14}/> Goal Progress
            </div>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Today: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-8">
            {/* Calories Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-700">Daily Calories</span>
                <span className="text-sm font-medium"><span className="text-lg font-black text-indigo-600">{healthStats.actual.calories}</span> / {healthStats.goals.calories} kcal</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgress(healthStats.actual.calories, healthStats.goals.calories)}%` }}
                />
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-4">
              <MacroWidget label="Protein" actual={healthStats.actual.protein} goal={healthStats.goals.protein} color="bg-emerald-500" />
              <MacroWidget label="Carbs" actual={healthStats.actual.carbs} goal={healthStats.goals.carbs} color="bg-amber-500" />
              <MacroWidget label="Fats" actual={healthStats.actual.fats} goal={healthStats.goals.fats} color="bg-rose-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function MetricBox({ icon, label, value, capitalize = false }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
      <div className="flex items-center gap-3 text-slate-500">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`font-bold text-slate-800 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

function MacroWidget({ label, actual, goal, color }: any) {
  const percent = Math.min(Math.round((actual / parseInt(goal)) * 100), 100);
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</div>
      <div className="font-bold text-slate-800 mb-2">{actual}g <span className="text-slate-400 text-xs font-normal">/ {goal}</span></div>
      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}