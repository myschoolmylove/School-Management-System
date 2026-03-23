import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Admissions from "./pages/Admissions";
import Scholarships from "./pages/Scholarships";
import SchoolAdmin from "./pages/SchoolAdmin";
import Pricing from "./pages/Pricing";
import SuperAdmin from "./pages/SuperAdmin";
import Login from "./pages/Login";
import ParentPortal from "./pages/ParentPortal";
import TeacherDashboard from "./pages/TeacherDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex min-h-screen flex-col font-sans text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/results" element={<Results />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/admin" element={<SchoolAdmin />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/parent-portal" element={<ParentPortal />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/finance-dashboard" element={<FinanceDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
