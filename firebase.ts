import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import config from "../../firebase-applet-config.json";
import type { Conversation, Goal, DailyLog, UserProfile } from "../types";

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use custom firestoreDatabaseId if provisioned
export const db = getFirestore(
  app,
  config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
    ? config.firestoreDatabaseId
    : "(default)"
);

const googleProvider = new GoogleAuthProvider();

// ================= Authentication Functions =================

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ================= Firestore User Profile =================

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn("Firestore fetchUserProfile fallback to local:", err);
  }
  const local = localStorage.getItem(`savean_user_${userId}`);
  return local ? JSON.parse(local) : null;
}

export async function saveUserProfileToFirestore(userId: string, profile: Partial<UserProfile>): Promise<void> {
  try {
    const ref = doc(db, "users", userId);
    await setDoc(ref, profile, { merge: true });
  } catch (err) {
    console.warn("Firestore saveUserProfile error, saving to local:", err);
  }
  localStorage.setItem(`savean_user_${userId}`, JSON.stringify(profile));
}

// ================= Firestore Conversations =================

export async function fetchUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const colRef = collection(db, "users", userId, "conversations");
    const snap = await getDocs(colRef);
    const list: Conversation[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Conversation);
    });
    if (list.length > 0) {
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      return list;
    }
  } catch (err) {
    console.warn("Firestore fetchUserConversations fallback to local:", err);
  }
  const local = localStorage.getItem(`savean_chats_${userId}`);
  return local ? JSON.parse(local) : [];
}

export async function saveConversationToFirestore(userId: string, conv: Conversation): Promise<void> {
  try {
    const ref = doc(db, "users", userId, "conversations", conv.id);
    await setDoc(ref, conv, { merge: true });
  } catch (err) {
    console.warn("Firestore saveConversation error, caching locally:", err);
  }

  // Update local cache
  const local = localStorage.getItem(`savean_chats_${userId}`);
  const list: Conversation[] = local ? JSON.parse(local) : [];
  const idx = list.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    list[idx] = conv;
  } else {
    list.unshift(conv);
  }
  localStorage.setItem(`savean_chats_${userId}`, JSON.stringify(list));
}

export async function deleteConversationFromFirestore(userId: string, convId: string): Promise<void> {
  try {
    const ref = doc(db, "users", userId, "conversations", convId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn("Firestore deleteConversation error:", err);
  }

  const local = localStorage.getItem(`savean_chats_${userId}`);
  if (local) {
    const list: Conversation[] = JSON.parse(local).filter((c: Conversation) => c.id !== convId);
    localStorage.setItem(`savean_chats_${userId}`, JSON.stringify(list));
  }
}

// ================= Firestore Goals =================

export async function fetchUserGoals(userId: string): Promise<Goal[]> {
  try {
    const colRef = collection(db, "users", userId, "goals");
    const snap = await getDocs(colRef);
    const list: Goal[] = [];
    snap.forEach((d) => list.push(d.data() as Goal));
    if (list.length > 0) {
      list.sort((a, b) => b.createdAt - a.createdAt);
      return list;
    }
  } catch (err) {
    console.warn("Firestore fetchUserGoals fallback to local:", err);
  }
  const local = localStorage.getItem(`savean_goals_${userId}`);
  return local ? JSON.parse(local) : [];
}

export async function saveGoalToFirestore(userId: string, goal: Goal): Promise<void> {
  try {
    const ref = doc(db, "users", userId, "goals", goal.id);
    await setDoc(ref, goal, { merge: true });
  } catch (err) {
    console.warn("Firestore saveGoal error, caching locally:", err);
  }

  const local = localStorage.getItem(`savean_goals_${userId}`);
  const list: Goal[] = local ? JSON.parse(local) : [];
  const idx = list.findIndex((g) => g.id === goal.id);
  if (idx >= 0) {
    list[idx] = goal;
  } else {
    list.unshift(goal);
  }
  localStorage.setItem(`savean_goals_${userId}`, JSON.stringify(list));
}

export async function deleteGoalFromFirestore(userId: string, goalId: string): Promise<void> {
  try {
    const ref = doc(db, "users", userId, "goals", goalId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn("Firestore deleteGoal error:", err);
  }

  const local = localStorage.getItem(`savean_goals_${userId}`);
  if (local) {
    const list: Goal[] = JSON.parse(local).filter((g: Goal) => g.id !== goalId);
    localStorage.setItem(`savean_goals_${userId}`, JSON.stringify(list));
  }
}

// ================= Firestore Daily Logs =================

export async function fetchUserDailyLogs(userId: string): Promise<DailyLog[]> {
  try {
    const colRef = collection(db, "users", userId, "daily_tracking");
    const snap = await getDocs(colRef);
    const list: DailyLog[] = [];
    snap.forEach((d) => list.push(d.data() as DailyLog));
    if (list.length > 0) {
      list.sort((a, b) => b.date.localeCompare(a.date));
      return list;
    }
  } catch (err) {
    console.warn("Firestore fetchDailyLogs fallback to local:", err);
  }
  const local = localStorage.getItem(`savean_daily_${userId}`);
  return local ? JSON.parse(local) : [];
}

export async function saveDailyLogToFirestore(userId: string, log: DailyLog): Promise<void> {
  try {
    const ref = doc(db, "users", userId, "daily_tracking", log.date);
    await setDoc(ref, log, { merge: true });
  } catch (err) {
    console.warn("Firestore saveDailyLog error, caching locally:", err);
  }

  const local = localStorage.getItem(`savean_daily_${userId}`);
  const list: DailyLog[] = local ? JSON.parse(local) : [];
  const idx = list.findIndex((l) => l.date === log.date);
  if (idx >= 0) {
    list[idx] = log;
  } else {
    list.unshift(log);
  }
  localStorage.setItem(`savean_daily_${userId}`, JSON.stringify(list));
}
