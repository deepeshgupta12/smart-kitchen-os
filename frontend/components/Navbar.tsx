"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChefHat, Search, ThermometerSnowflake, 
  Calendar, ShoppingBasket, User 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Pantry', href: '/pantry', icon: <ThermometerSnowflake className="w-6 h-6" /> },
    { name: 'Planner', href: '/planner', icon: <Calendar className="w-6 h-6" /> },
    { name: 'Cart', href: '/cart', icon: <ShoppingBasket className="w-6 h-6" /> },
    { name: 'Profile', href: '/profile', icon: <User className="w-6 h-6" /> }, // NEW V6 LINK
  ];

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-green-600 p-1.5 rounded-lg">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SmartKitchen OS</h1>
        </Link>
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
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex flex-col items-center transition-colors ${
                isActive ? 'text-green-600' : 'hover:text-green-600'
              }`}
            >
              {link.icon}
              <span className="text-[10px] uppercase font-bold mt-1">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}