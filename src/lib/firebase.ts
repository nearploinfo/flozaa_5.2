"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signOut,
  type Auth,
} from "firebase/auth";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGEING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MESUMENT_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  void setPersistence(authInstance, browserLocalPersistence);
  return authInstance;
}

export const googleProvider = new GoogleAuthProvider();

export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(getFirebaseAuth(), containerId, { size: "invisible" });
}

export function signOutFirebase(): Promise<void> {
  return signOut(getFirebaseAuth()).catch(() => {});
}

/** Resolves the FCM registration token, or null if messaging isn't supported/permitted. */
export async function fetchFcmToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const messaging: Messaging = getMessaging(getFirebaseApp());
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    // Single service worker (public/sw.js) handles both PWA install and FCM background
    // messages — point getToken at its registration instead of firebase's default
    // "/firebase-messaging-sw.js" lookup.
    // register() resolves as soon as install starts — getToken's push subscribe
    // needs an *active* worker, so wait for .ready or subscribe throws AbortError.
    await navigator.serviceWorker.register("/sw.js");
    const swRegistration = await navigator.serviceWorker.ready;
    return await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
  } catch (error) {
    console.error("Failed to fetch FCM token:", error);
    return null;
  }
}

/** Foreground push listener — background messages (tab hidden/closed) are
 * handled entirely by the service worker (public/sw.js) and never reach the
 * page, but while the tab is open/focused, Firebase delivers them here
 * instead of showing an OS notification. Without this, the app has no way
 * to know a push arrived until the next poll (or a reload re-fetches on
 * mount) — badges looked stuck until the user manually reloaded.
 * Returns an unsubscribe function, or null if messaging isn't supported. */
export async function onFcmMessage(callback: () => void): Promise<(() => void) | null> {
  if (typeof window === "undefined") return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const messaging: Messaging = getMessaging(getFirebaseApp());
    return onMessage(messaging, () => callback());
  } catch (error) {
    console.error("Failed to attach FCM foreground listener:", error);
    return null;
  }
}
