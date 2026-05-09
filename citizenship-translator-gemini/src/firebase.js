import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

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

// Called on every login — creates user if first time, fetches if returning
export const getOrCreateUser = async (firebaseUser) => {
  try {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
    // First time login — create user record
      await setDoc(ref, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        plan: "free",
        scansUsed: 0,
        editsUsed: 0,
        pdfsGenerated: 0,
        pdfsLimit: 5,
        createdAt: new Date().toISOString(),
      });
      return { plan: "free", scansUsed: 0, pdfsGenerated: 0, pdfsLimit: 5 };
    }

    return snap.data();
  } catch (err) {
    console.warn("⚠️ Firestore unavailable (VPN/offline), using default profile");
    return { plan: "free", scansUsed: 0, pdfsGenerated: 0, pdfsLimit: 5 };
  }
};

// Call this when user generates a PDF
export const incrementPDFCount = async (uid) => {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { pdfsGenerated: increment(1) });
  } catch (err) {
    console.warn("⚠️ Could not update PDF count (offline)");
  }
};

// Call this when user does a scan
export const incrementScanCount = async (uid) => {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { scansUsed: increment(1) });
  } catch (err) {
    console.warn("⚠️ Could not update scan count (offline)");
  }
};