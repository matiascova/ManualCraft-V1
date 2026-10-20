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
import type { Client } from '../types/client';
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
 * Optimizes step image data URLs if the manual JSON exceeds Firestore's 1MB document limit,
 * ensuring seamless cloud synchronization across all users.
 */
async function optimizeManualForFirestore(manual: UserManual): Promise<UserManual> {
  const payloadStr = JSON.stringify(manual);
  // If comfortably under 850KB, save directly
  if (payloadStr.length < 850000 || typeof document === 'undefined') {
    return manual;
  }

  // Downsample high-res JPEGs if total payload approaches Firestore 1MB limit
  const optimizedSteps = await Promise.all(
    manual.steps.map(async (step) => {
      if (!step.image || !step.image.startsWith('data:image/jpeg') && !step.image.startsWith('data:image/png')) {
        return step;
      }
      if (step.image.length > 100000) {
        try {
          const img = new Image();
          img.src = step.image;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          const canvas = document.createElement('canvas');
          const maxDim = 960;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.72);
            canvas.width = 0;
            canvas.height = 0;
            return { ...step, image: compressed };
          }
        } catch {
          return step;
        }
      }
      return step;
    })
  );

  return { ...manual, steps: optimizedSteps };
}

/**
 * Saves a manual to the shared database so all users can access it.
 */
export async function saveManualToDatabase(manual: UserManual): Promise<boolean> {
  try {
    const docRef = doc(db, 'manuals', manual.id);
    const guardedManual = await optimizeManualForFirestore(manual);
    const cleaned = cleanForFirestore({
      ...guardedManual,
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

// =========================================================================
// Real-time Collaborative Sync for Clients (Nivel Superior de la Jerarquía)
// =========================================================================

export function subscribeToSharedClients(
  onUpdate: (clients: Client[]) => void,
  onError?: (error: Error) => void
) {
  const clientsCol = collection(db, 'clients');

  return onSnapshot(
    clientsCol,
    (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Client;
        list.push({ ...data, id: docSnap.id });
      });
      onUpdate(list);
    },
    (err) => {
      console.error('[Firebase] Error synchronizing shared clients:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveClientToDatabase(client: Client): Promise<boolean> {
  try {
    const docRef = doc(db, 'clients', client.id);
    const cleaned = cleanForFirestore({
      ...client,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to save client to shared database:', err);
    return false;
  }
}

export async function deleteClientFromDatabase(clientId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'clients', clientId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to delete client from shared database:', err);
    return false;
  }
}

