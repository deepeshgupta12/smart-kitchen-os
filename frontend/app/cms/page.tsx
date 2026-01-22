// frontend/src/app/cms/page.tsx
import DishManager from "@/components/DishManager";
import { Database } from "lucide-react";

export default function CMSPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* Ensure Navbar is visible for navigation back to Home/Profile */}
      <header className="max-w-7xl mx-auto p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Database className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Content Management System</h1>
            <p className="text-slate-500 font-medium">Monitoring persistent dish entities and macro-data.</p>
          </div>
        </div>
        <DishManager />
      </header>
    </main>
  );
}