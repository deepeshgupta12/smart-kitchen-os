'use client';

import React, { useEffect, useState } from 'react';
import { getPantryInventory, addToPantry } from '@/lib/api';
import { 
  ChevronLeft, 
  Package, 
  Plus, 
  Minus, 
  Search, 
  AlertCircle,
  Box,
  ThermometerSnowflake
} from 'lucide-react';
import Link from 'next/link';

export default function VirtualFridge() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPantry();
  }, []);

  async function loadPantry() {
    setLoading(true);
    try {
      const data = await getPantryInventory();
      setInventory(data);
    } catch (err) {
      console.error("Error loading pantry:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdjustQuantity = async (itemName: string, delta: number, unit: string) => {
    try {
      await addToPantry(itemName, delta, unit);
      await loadPantry();
    } catch (err) {
      alert("Failed to update quantity");
    }
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedInventory = filteredItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading && inventory.length === 0) return <div className="p-20 text-center font-bold">Opening Fridge...</div>;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <nav className="bg-white border-b px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Virtual Fridge</h1>
            <p className="text-slate-500 text-sm font-medium">Real-time inventory management</p>
          </div>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search stock..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        {inventory.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Box className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Your fridge is empty.</p>
            <p className="text-slate-400 text-sm">Add items via the shopping list to see them here.</p>
          </div>
        ) : (
          Object.keys(groupedInventory).map((category) => (
            <div key={category} className="mb-12">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Package className="w-4 h-4" /> {category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedInventory[category].map((item: any) => (
                  <div key={item.id} className="bg-white rounded-4xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                        <img 
                          src={item.thumbnail_url || 'https://via.placeholder.com/150'} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-slate-900 leading-tight">{item.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.unit}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                      <button 
                        onClick={() => handleAdjustQuantity(item.name, -1, item.unit)}
                        className="p-2 bg-white rounded-xl shadow-sm hover:text-red-500 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <div className="text-center">
                        <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                        <span className="text-[10px] ml-1 font-bold text-slate-400 uppercase">{item.unit}</span>
                      </div>

                      <button 
                        onClick={() => handleAdjustQuantity(item.name, 1, item.unit)}
                        className="p-2 bg-white rounded-xl shadow-sm hover:text-green-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {item.quantity < 2 && (
                      <div className="mt-4 flex items-center gap-2 text-orange-500">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Low Stock Warning</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}