
'use client';

import { useEffect } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

/**
 * A component that listens for auth state changes and ensures a 
 * corresponding UserProfile document exists in Firestore.
 */
export function UserProfileSynchronizer() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (isUserLoading || !user || !db) return;

    const syncProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create initial profile
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || 'New User',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // Optional: Update existing profile with latest auth data
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || userSnap.data().displayName,
          photoURL: user.photoURL || userSnap.data().photoURL,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    };

    syncProfile().catch(console.error);
  }, [user, isUserLoading, db]);

  return null;
}