import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config.ts';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGestor: boolean;
  isMotorista: boolean;
  signInWithGoogle: () => Promise<void>;
  signInEmailPassword: (email: string, pass: string) => Promise<void>;
  signUpEmailPassword: (email: string, pass: string, name: string) => Promise<void>;
  signInAsDemo: (role: UserRole) => void;
  completeOnboarding: (data: Partial<UserProfile> & { role: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_GESTOR_UID = 'demo-admin-gestor-frota';
const DEMO_DRIVER_UID = 'demo-driver-carlos';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or setup profile in Firestore
  const fetchUserProfile = async (user: User): Promise<UserProfile> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || data.displayName || 'Usuário',
          role: data.role || null, // null if onboarding hasn't been chosen yet
          companyName: data.companyName,
          cnhNumber: data.cnhNumber,
          cnhCategory: data.cnhCategory,
          cnhExpiration: data.cnhExpiration,
          phone: data.phone,
          fleetIds: data.fleetIds || [],
        };
      } else {
        // First login: profile initialized without role, waiting for onboarding
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
          role: null, // triggers Onboarding Screen!
          fleetIds: [],
        };
        await setDoc(userDocRef, {
          email: initialProfile.email,
          displayName: initialProfile.displayName,
          role: null,
          createdAt: new Date().toISOString(),
        });
        return initialProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Fallback
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Usuário',
        role: null,
      };
    }
  };

  useEffect(() => {
    // Check saved demo user first if no firebase auth
    const savedDemo = localStorage.getItem('lider_demo_session');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUserProfile(parsed);
      } catch (e) {
        localStorage.removeItem('lider_demo_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        if (!localStorage.getItem('lider_demo_session')) {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    localStorage.removeItem('lider_demo_session');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const profile = await fetchUserProfile(res.user);
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInEmailPassword = async (email: string, pass: string) => {
    setLoading(true);
    localStorage.removeItem('lider_demo_session');
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const profile = await fetchUserProfile(res.user);
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.error('Email sign in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpEmailPassword = async (email: string, pass: string, name: string) => {
    setLoading(true);
    localStorage.removeItem('lider_demo_session');
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        const profile = await fetchUserProfile(res.user);
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (data: Partial<UserProfile> & { role: UserRole }) => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, updatedData, { merge: true });

      setUserProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
    } else {
      // In demo mode
      if (userProfile) {
        const updated = { ...userProfile, ...data };
        setUserProfile(updated);
        localStorage.setItem('lider_demo_session', JSON.stringify(updated));
      }
    }
  };

  const signInAsDemo = (role: UserRole) => {
    const isGestorRole = role === 'gestor';
    const mockProfile: UserProfile = {
      uid: isGestorRole ? DEMO_GESTOR_UID : DEMO_DRIVER_UID,
      email: isGestorRole ? 'gestor.lider@frotas.com.br' : 'carlos.motorista@frotas.com.br',
      displayName: isGestorRole ? 'Marcos Gestor (Demonstração)' : 'Carlos Motorista (Demonstração)',
      role,
      companyName: isGestorRole ? 'Líder Prestação de Serviços & Logística' : undefined,
      cnhNumber: isGestorRole ? undefined : '05492817342',
      cnhCategory: isGestorRole ? undefined : 'AB',
      cnhExpiration: isGestorRole ? undefined : '2028-06-15',
      fleetIds: isGestorRole ? [] : [DEMO_GESTOR_UID],
    };
    setUserProfile(mockProfile);
    localStorage.setItem('lider_demo_session', JSON.stringify(mockProfile));
  };

  const signOut = async () => {
    localStorage.removeItem('lider_demo_session');
    setUserProfile(null);
    setCurrentUser(null);
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const isGestor = userProfile?.role === 'gestor';
  const isMotorista = userProfile?.role === 'motorista';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isGestor,
        isMotorista,
        signInWithGoogle,
        signInEmailPassword,
        signUpEmailPassword,
        signInAsDemo,
        completeOnboarding,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
