import { GraduationCap, Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                My School <span className="text-emerald-600">My Love</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate-600">
              Pakistan's leading education portal and school management platform. 
              Connecting students, parents, and schools for a better future.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-emerald-600"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-emerald-600"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-emerald-600"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-emerald-600"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Education</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="/results" className="text-sm text-slate-600 hover:text-emerald-600">Board Results</a></li>
              <li><a href="/admissions" className="text-sm text-slate-600 hover:text-emerald-600">Admissions</a></li>
              <li><a href="/scholarships" className="text-sm text-slate-600 hover:text-emerald-600">Scholarships</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-emerald-600">Past Papers</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">For Schools</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="/admin" className="text-sm text-slate-600 hover:text-emerald-600">Admin Panel</a></li>
              <li><a href="/pricing" className="text-sm text-slate-600 hover:text-emerald-600">Pricing Plans</a></li>
              <li><a href="/super-admin" className="text-sm text-slate-600 hover:text-emerald-600">Super Admin</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-emerald-600">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-black/5 pt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} My School My Love. All rights reserved. Made with ❤️ in Pakistan.
          </p>
        </div>
      </div>
    </footer>
  );
}
