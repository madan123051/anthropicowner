import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

const required = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let authPromise: Promise<User> | null = null;

function configured(): boolean {
  return Object.values(required).every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

function app(): FirebaseApp {
  if (!configured()) {
    throw new Error(
      "Firebase is not configured. Add the required VITE_FIREBASE_* environment variables.",
    );
  }
  return getApps().length ? getApp() : initializeApp(required);
}

export function realtimeDatabase(): Database {
  return getDatabase(app());
}

export function anonymousUser(): Promise<User> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Anonymous Firebase auth is browser-only."));
  }
  authPromise ??= (async () => {
    const auth = getAuth(app());
    if (auth.currentUser) return auth.currentUser;
    return (await signInAnonymously(auth)).user;
  })().catch((error) => {
    authPromise = null;
    throw error;
  });
  return authPromise;
}
