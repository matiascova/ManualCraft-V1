import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import type { UserManual } from '../types/manual';
import type { Project } from '../types/project';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId provisioned for this applet
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection state tracking
let isConnectedToFirestore = false;
let connectionListeners: Array<(connected: boolean) => void> = [];

export function onFirestoreConnectionChange(listener: (connected: boolean) => void) {
  connectionListeners.push(listener);
  listener(isConnectedToFirestore);
  return () => {
    connectionListeners = connectionListeners.filter((l) => l !== listener);
  };
}

/**
 * Validate Connection to Firestore on startup as required by the Firebase Integration Skill
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnectedToFirestore = true;
    connectionListeners.forEach((l) => l(true));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] The client is offline or database is initializing.');
      isConnectedToFirestore = false;
      connectionListeners.forEach((l) => l(false));
    } else {
      // Permission denied or not-found on 'test/connection' is normal and confirms connectivity!
      isConnectedToFirestore = true;
      connectionListeners.forEach((l) => l(true));
    }
  }
}

testConnection();

// =========================================================================
// Real-time Collaborative Sync for Manuals (Accessible to all users)
// =========================================================================

/**
 * Listens in real time to the shared 'manuals' collection in Firestore.
 * When ANY user creates or edits a manual, this callback receives the updated list.
 */
export function subscribeToSharedManuals(
  onUpdate: (manuals: UserManual[]) => void,
  onError?: (error: Error) => void
) {
  const manualsCol = collection(db, 'manuals');

  return onSnapshot(
    manualsCol,
    (snapshot) => {
      const list: UserManual[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserManual;
        list.push({ ...data, id: docSnap.id });
      });
      onUpdate(list);
    },
    (err) => {
      console.error('[Firebase] Error synchronizing shared manuals:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Safely strips all undefined properties recursively from objects or arrays
 * before writing to Firestore, preventing 'Unsupported field value: undefined' errors.
 */
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (value === undefined) return null;
      return value;
    })
  );
}

/**
 * Saves a manual to the shared database so all users can access it.
 */
export async function saveManualToDatabase(manual: UserManual): Promise<boolean> {
  try {
    const docRef = doc(db, 'manuals', manual.id);
    const cleaned = cleanForFirestore({
      ...manual,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to save manual to shared database:', err);
    return false;
  }
}

/**
 * Deletes a manual from the shared database.
 */
export async function deleteManualFromDatabase(manualId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'manuals', manualId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to delete manual from shared database:', err);
    return false;
  }
}

// =========================================================================
// Real-time Collaborative Sync for Projects
// =========================================================================

export function subscribeToSharedProjects(
  onUpdate: (projects: Project[]) => void,
  onError?: (error: Error) => void
) {
  const projectsCol = collection(db, 'projects');

  return onSnapshot(
    projectsCol,
    (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Project;
        list.push({ ...data, id: docSnap.id });
      });
      onUpdate(list);
    },
    (err) => {
      console.error('[Firebase] Error synchronizing shared projects:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveProjectToDatabase(project: Project): Promise<boolean> {
  try {
    const docRef = doc(db, 'projects', project.id);
    const cleaned = cleanForFirestore({
      ...project,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to save project to shared database:', err);
    return false;
  }
}

export async function deleteProjectFromDatabase(projectId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to delete project from shared database:', err);
    return false;
  }
}
