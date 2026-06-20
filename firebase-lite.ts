import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore/lite';
import firebaseConfig from './firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const getDbInstance = () => {
  try {
    return getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  } catch (e) {
    return initializeFirestore(app, {}, (firebaseConfig as any).firestoreDatabaseId);
  }
};

export const db = getDbInstance();
