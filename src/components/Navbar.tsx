import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, X, MessageCircle, LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Results", href: "/results" },
  { name: "Admissions", href: "/admissions" },
  { name: "Pricing", href: "/pricing" },
  { name: "Parent Portal", href: "/parent-portal" },
  { name: "Login", href: "/login" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdminPage = location.pathname.startsWith("/admin") || 
                     location.pathname.startsWith("/super-admin") ||
                     location.pathname.startsWith("/parent-portal");

  if (isAdminPage && user) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {profile?.role === 'super' ? 'Super Admin' : 
               profile?.role === 'parent' ? 'Parent Portal' : 
               profile?.role === 'teacher' ? 'Teacher Portal' : 'School Admin'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">{profile?.name || user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    );
  }

  const getPortalLink = () => {
    if (!profile) return { name: "Parent Portal", href: "/parent-portal" };
    switch (profile.role) {
      case "super": return { name: "Super Admin", href: "/super-admin" };
      case "teacher": return { name: "Teacher Portal", href: "/teacher-dashboard" };
      case "finance": return { name: "Finance Portal", href: "/finance-dashboard" };
      case "parent":
      case "student":
        return { name: "Parent Portal", href: "/parent-portal" };
      default: return { name: "School Admin", href: "/admin" };
    }
  };

  const portalLink = getPortalLink();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-emerald-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            My School <span className="text-emerald-600">My Love</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.filter(link => {
            if (link.name === "Login" && user) return false;
            if (link.name === "Parent Portal") return false; // Handled separately
            return true;
          }).map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
            >
              {link.name}
            </Link>
          ))}
          {user && (
            <Link
              to={portalLink.href}
              className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            >
              {portalLink.name}
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition-transform hover:scale-105 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
          <a
            href="https://wa.me/yournumber"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "md:hidden",
          isOpen ? "block border-t border-black/5 bg-white" : "hidden"
        )}
      >
        <div className="space-y-1 px-4 pb-3 pt-2">
          {navLinks.filter(link => {
            if (link.name === "Login" && user) return false;
            if (link.name === "Parent Portal") return false; // Handled separately
            return true;
          }).map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            >
              {link.name}
            </Link>
          ))}
          {user && (
            <Link
              to={portalLink.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-emerald-600 hover:bg-emerald-50"
            >
              {portalLink.name}
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-base font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          )}
          <a
            href="https://wa.me/yournumber"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-base font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp Channel
          </a>
        </div>
      </div>
    </nav>
  );
}
