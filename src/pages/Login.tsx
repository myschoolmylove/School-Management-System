import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, School, Chrome } from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { UserProfile } from "../types";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"school" | "super" | "parent" | "teacher" | "finance">("school");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "schools"));
        const schoolList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setSchools(schoolList);
      } catch (err) {
        console.error("Error fetching schools:", err);
      }
    };
    fetchSchools();
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    setSuccess("");
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        
        // If they are logging in with Google, we might want to update their role if they are the super admin
        if (user.email === "ernestvdavid@gmail.com" && profile.role !== "super") {
          await setDoc(docRef, { role: "super" }, { merge: true });
          profile.role = "super";
        }

        switch (profile.role) {
          case "super": navigate("/super-admin"); break;
          case "parent": navigate("/parent-portal"); break;
          case "teacher": navigate("/teacher-dashboard"); break; 
          case "school": navigate("/admin"); break;
          case "finance": navigate("/finance-dashboard"); break;
          default: navigate("/");
        }
      } else {
        // New user via Google
        const isSuperAdmin = user.email === "ernestvdavid@gmail.com";
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          role: isSuperAdmin ? "super" : "parent", // Default to parent if not super admin
          name: user.displayName || "New User",
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        
        if (isSuperAdmin) {
          navigate("/super-admin");
        } else {
          // If not super admin, they might need to be assigned to a school
          setSuccess("Account created! Please contact your school administrator to assign your role and school.");
          navigate("/parent-portal"); // Default landing
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    if ((role === "teacher" || role === "parent") && !selectedSchool) {
      setError("Please select your school");
      setIsLoading(false);
      return;
    }

    try {
      // Check for maintenance mode first (except for super admins)
      if (role !== "super") {
        try {
          const configSnap = await getDoc(doc(db, "system_config", "settings"));
          if (configSnap.exists() && configSnap.data().maintenanceMode) {
            setError("System is currently under maintenance. Please try again later.");
            setIsLoading(false);
            return;
          }
        } catch (configErr) {
          console.warn("Maintenance check failed, continuing login:", configErr);
          // If maintenance check fails (e.g. offline), we continue with login attempt
        }
      }

      let loginEmail = email.trim();
      
      // Handle Parent/Teacher usernames (Name or Mobile Number)
      if ((role === "parent" || role === "teacher") && !loginEmail.includes("@")) {
        // Sanitize username for virtual email
        const sanitizedUsername = loginEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
        loginEmail = `${sanitizedUsername}@${selectedSchool}.${role}.com`;
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        if (profile.role !== role) {
          setError(`Invalid role for this account. Your account is registered as a ${profile.role}, but you are trying to login as a ${role}.`);
          await auth.signOut();
          setIsLoading(false);
          return;
        }
        
        // If school admin, check if school is active
        if (profile.role === "school" && profile.schoolId) {
          const schoolSnap = await getDoc(doc(db, "schools", profile.schoolId));
          if (schoolSnap.exists() && schoolSnap.data().status === "Suspended") {
            setError("Your school account is suspended. Please contact support.");
            await auth.signOut();
            setIsLoading(false);
            return;
          }
        }
        
        switch (profile.role) {
          case "super": navigate("/super-admin"); break;
          case "parent": navigate("/parent-portal"); break;
          case "teacher": navigate("/teacher-dashboard"); break; 
          case "school": navigate("/admin"); break;
          case "finance": navigate("/finance-dashboard"); break;
        }
      } else if (role === "super" && user.email === "ernestvdavid@gmail.com") {
        // Auto-create super admin profile if missing
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "ernestvdavid@gmail.com",
          role: "super",
          name: "Main Admin",
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        navigate("/super-admin");
      } else {
        setError("User profile not found in database. Please contact school administration to ensure your account is properly set up.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setError("Email/Password authentication is not enabled in the Firebase Console.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setError("Invalid username/mobile or password. Please check your credentials.");
      } else {
        setError(err.message || "Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setIsResetting(true);
    setError("");
    setSuccess("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsResetting(false);
    }
  };

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    setError("");
    setSuccess("");
    const bootstrapEmail = "ernestvdavid@gmail.com";
    const bootstrapPassword = "Admin@123";
    
    try {
      // Try to create the user in Auth
      let uid = "";
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, bootstrapEmail, bootstrapPassword);
        uid = userCredential.user.uid;
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use") {
          // If user exists, we need to sign in to get the UID or just use a placeholder if we can't get it
          // Actually, we can't get the UID without signing in or using admin SDK.
          // But we can try to sign in with the known password.
          try {
            const userCredential = await signInWithEmailAndPassword(auth, bootstrapEmail, bootstrapPassword);
            uid = userCredential.user.uid;
          } catch (signInErr: any) {
            if (signInErr.code === "auth/invalid-credential") {
              throw new Error("Account already exists with a different password. Please sign in normally.");
            }
            throw signInErr;
          }
        } else {
          throw authErr;
        }
      }

      // Ensure the Firestore document exists
      await setDoc(doc(db, "users", uid), {
        email: bootstrapEmail,
        role: "super",
        name: "Main Admin",
        createdAt: new Date().toISOString()
      }, { merge: true });

      setSuccess("Super Admin account is ready! You can now sign in.");
      setEmail(bootstrapEmail);
      setPassword(bootstrapPassword);
      setRole("super");
    } catch (err: any) {
      console.error("Bootstrap error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("CRITICAL: Email/Password authentication is not enabled in the Firebase Console.");
      } else {
        setError(err.message || "Failed to bootstrap admin account");
      }
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-black/5 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to your school management account</p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-emerald-200 shadow-sm disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            ) : (
              <Chrome className="h-5 w-5 text-emerald-600" />
            )}
            Sign in with Google
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-400">Or use credentials</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1 no-scrollbar">
          {(["school", "finance", "teacher", "parent", "super"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                role === r ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {r === "super" ? "Super Admin" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-600">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {(role === "teacher" || role === "parent") && (
              <div className="space-y-2">
                <div className="relative">
                  <School className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    required
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  >
                    <option value="">Select your school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-[10px] font-medium text-emerald-700 space-y-1">
                  <p className="font-bold uppercase tracking-wider">Login Instructions:</p>
                  {role === "parent" ? (
                    <>
                      <p>• Select your child's school above.</p>
                      <p>• Use child's <span className="font-bold">Roll Number</span> as username.</p>
                      <p>• Default Password: <span className="font-bold">Parent@123</span></p>
                    </>
                  ) : (
                    <>
                      <p>• Select your school above.</p>
                      <p>• Use your assigned <span className="font-bold">Username</span> or Email.</p>
                      <p>• Default Password: <span className="font-bold">Teacher@123</span></p>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder={role === "parent" ? "Roll Number or Username" : role === "teacher" ? "Username or Email" : "Email address"}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="font-medium text-emerald-600 hover:text-emerald-500 disabled:opacity-50"
              >
                {isResetting ? "Sending..." : "Forgot password?"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <button
            onClick={handleBootstrap}
            disabled={isBootstrapping}
            className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:border-emerald-200 hover:text-emerald-600 transition-all disabled:opacity-50"
          >
            {isBootstrapping ? "Bootstrapping..." : "Bootstrap Initial Super Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
