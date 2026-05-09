import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDV28AYSSsheayiNpKWk_OFMAoOHNvPBq4",
  authDomain: "citizenship-translator.firebaseapp.com",
  projectId: "citizenship-translator",
  storageBucket: "citizenship-translator.firebasestorage.app",
  messagingSenderId: "185725968166",
  appId: "1:185725968166:web:6aa817dba4879e0fe22be7",
  measurementId: "G-L8PZDBV16H"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// ─── Create or fetch user profile ─────────────────────────────────────────────
export const getOrCreateUser = async (firebaseUser) => {
  try {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // First time login — create user record with all fields
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        plan: "free",
        scansUsed: 0,
        editsUsed: 0,
        pdfsGenerated: 0,
        pdfsLimit: 5,
        subscriptionStart: null,
        subscriptionEnd: null,
        subscriptionMonths: null,
        paymentMethod: null,
        paymentReference: null,
        lastLoginAt: serverTimestamp(),
        lastScanAt: null,
        lastPDFAt: null,
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, userData);
      return { ...userData, lastLoginAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    }

    // Update last login timestamp
    await updateDoc(ref, { lastLoginAt: serverTimestamp() });

    return snap.data();
  } catch (err) {
    console.warn("⚠️ Firestore unavailable (VPN/offline), using default profile");
    return { plan: "free", scansUsed: 0, pdfsGenerated: 0, pdfsLimit: 5 };
  }
};

// ─── Check and handle subscription expiry ─────────────────────────────────────
export const checkAndHandleExpiry = async (uid, profile) => {
  // Only check premium users with an expiry date
  if (profile.plan !== "premium" || !profile.subscriptionEnd) return profile;
  
  const today = new Date();
  const expiryDate = new Date(profile.subscriptionEnd);
  
  console.log("🔍 Expiry check:", {
    plan: profile.plan,
    today: today.toISOString().split('T')[0],
    expiryDate: profile.subscriptionEnd,
    expired: today > expiryDate
  });
  
  // If expired, auto-downgrade to free
  if (today > expiryDate) {
    console.log("⏰ Premium expired, auto-downgrading to free");
    
    try {
      const ref = doc(db, "users", uid);
      await updateDoc(ref, {
        plan: "free",
        pdfsLimit: 5,
        pdfsGenerated: 0,
        downgradedAt: serverTimestamp(),
        lastExpiryCheck: serverTimestamp()
      });
      
      return {
        ...profile,
        plan: "free",
        pdfsLimit: 5,
        pdfsGenerated: 0
      };
    } catch (err) {
      console.error("Failed to downgrade user:", err);
      return profile;
    }
  }
  
  // Not expired, update check timestamp
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { lastExpiryCheck: serverTimestamp() });
  } catch (err) {
    console.warn("Could not update expiry check timestamp");
  }
  
  return profile;
};

// ─── Check and reset monthly PDF counter ──────────────────────────────────────
export const checkMonthlyReset = async (uid, profile) => {
  if (!profile.lastPDFAt) return profile; // Never generated a PDF yet
  
  try {
    const lastDate = new Date(profile.lastPDFAt);
    const today = new Date();
    
    // Check if it's a new month
    const isNewMonth = lastDate.getMonth() !== today.getMonth() || lastDate.getFullYear() !== today.getFullYear();
    
    if (isNewMonth) {
      console.log("📅 New month detected, resetting PDF counter");
      const ref = doc(db, "users", uid);
      await updateDoc(ref, { pdfsGenerated: 0 });
      return { ...profile, pdfsGenerated: 0 };
    }
    
    return profile;
  } catch (err) {
    console.warn("Could not check monthly reset");
    return profile;
  }
};

// ─── Increment PDF count ──────────────────────────────────────────────────────
export const incrementPDFCount = async (uid) => {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      pdfsGenerated: increment(1),
      lastPDFAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("⚠️ Could not update PDF count (offline)");
  }
};

// ─── Increment scan count ─────────────────────────────────────────────────────
export const incrementScanCount = async (uid) => {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      scansUsed: increment(1),
      lastScanAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("⚠️ Could not update scan count (offline)");
  }
};