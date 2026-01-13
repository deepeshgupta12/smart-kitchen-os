'use client';

import React, { useEffect, useState } from 'react';
import { getShoppingList } from '@/lib/api';
import { ShoppingBasket, ChevronLeft, CheckCircle, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ShoppingList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getShoppingList();
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Group items by category (Produce, Dairy, etc.)
  const groupedItems = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) return <div className="p-20 text-center font-bold">Consolidating Ingredients...</div>;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      <nav className="bg-white border-b px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping List</h1>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
          <ShoppingBasket className="w-4 h-4" />
          {items.length} Items Total
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        {items.length > 0 ? (
          Object.keys(groupedItems).map((category) => (
            <div key={category} className="mb-10">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> {category}
              </h2>
              <div className="grid gap-3">
                {groupedItems[category].map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-green-500 transition-colors">
                        <CheckCircle className="w-4 h-4 text-transparent group-hover:text-green-500" />
                      </div>
                      <span className="font-bold text-slate-800 text-lg">{item.name}</span>
                    </div>
                    <div className="bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100 font-black text-slate-600">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <ShoppingBasket className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Your shopping list is empty.</p>
            <p className="text-slate-400 text-sm">Schedule some meals in the Planner to generate a list.</p>
            <Link href="/planner">
              <button className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-indigo-600 transition-all">
                Go to Planner <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}