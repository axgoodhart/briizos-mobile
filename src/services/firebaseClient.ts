import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export interface BriizFirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

const firebaseConfig = {
  apiKey: 'AIzaSyDibdtqeea1yHqi4ddlZCmAhuq269iK06c',
  authDomain: 'briizos.firebaseapp.com',
  projectId: 'briizos',
  storageBucket: 'briizos.firebasestorage.app',
  messagingSenderId: '719807847926',
  appId: '1:719807847926:web:96ff6b12166b2dec25fbd7',
  measurementId: 'G-DCXFC8CS51',
}

let services: BriizFirebaseServices | null = null
let persistenceReady: Promise<void> | null = null

export function getBriizFirebase(): BriizFirebaseServices {
  if (services) return services

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  services = { app, auth, db }
  return services
}

export function ensureFirebaseAuthPersistence(): Promise<void> {
  if (persistenceReady) return persistenceReady

  const { auth } = getBriizFirebase()
  persistenceReady = setPersistence(auth, browserLocalPersistence)
  return persistenceReady
}
