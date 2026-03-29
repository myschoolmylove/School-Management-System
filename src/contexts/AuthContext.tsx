import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            let data = docSnap.data() as UserProfile;
            
            // Bootstrap super admin if email matches
            const superAdminEmails = ["ernestvdavid@gmail.com", "abes.gujranwala@gmail.com"];
            if (user.email && superAdminEmails.includes(user.email) && data.role !== "super") {
              await setDoc(docRef, { role: "super" }, { merge: true });
              data.role = "super";
            }
            
            setProfile({ ...data, uid: user.uid });
          } else if (user.email && ["ernestvdavid@gmail.com", "abes.gujranwala@gmail.com"].includes(user.email)) {
            // Create super admin profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              role: "super",
              name: user.displayName || "Main Admin",
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await auth.signOut();
    // Clear any local storage if needed
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
