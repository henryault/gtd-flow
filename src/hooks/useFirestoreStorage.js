import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Drop-in replacement for useLocalStorage that syncs with Firestore.
 * Same API: useFirestoreStorage(key, initialValue) → [value, setValue]
 *
 * - Reads via onSnapshot (real-time cross-device sync)
 * - Writes debounced at 500ms to reduce Firestore operations
 * - Migrates existing localStorage data on first sign-in
 */
export function useFirestoreStorage(key, initialValue) {
  const { user } = useAuth();

  // Initialize from localStorage (for migration and pre-auth display)
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const valueRef = useRef(value);
  valueRef.current = value;

  const pendingWriteRef = useRef(null);
  const timerRef = useRef(null);
  const hasMigratedRef = useRef(false);
  const initializedFromFirestoreRef = useRef(false);

  // Flush pending write to Firestore
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingWriteRef.current && user) {
      const { docRef, data } = pendingWriteRef.current;
      pendingWriteRef.current = null;
      setDoc(docRef, data).catch(err => console.warn('Firestore write error:', err));
    }
  }, [user]);

  // Debounced write to Firestore
  const writeToFirestore = useCallback((newValue) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'data', key);
    pendingWriteRef.current = { docRef, data: { value: newValue } };

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 500);
  }, [user, key, flush]);

  // Custom setter that updates local state + triggers debounced Firestore write
  const setValueAndSync = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeToFirestore(next);
      return next;
    });
  }, [writeToFirestore]);

  // Subscribe to Firestore changes (real-time sync)
  useEffect(() => {
    if (!user) {
      initializedFromFirestoreRef.current = false;
      hasMigratedRef.current = false;
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'data', key);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const firestoreValue = snapshot.data().value;
        // Only update if this isn't from our own pending write
        if (!snapshot.metadata.hasPendingWrites) {
          setValue(firestoreValue);
          valueRef.current = firestoreValue;
        }
        initializedFromFirestoreRef.current = true;
      } else if (!hasMigratedRef.current) {
        // Document doesn't exist — migrate from localStorage
        hasMigratedRef.current = true;
        try {
          const localData = window.localStorage.getItem(key);
          if (localData) {
            const parsed = JSON.parse(localData);
            setDoc(docRef, { value: parsed }).catch(err =>
              console.warn('Migration write error:', err)
            );
            setValue(parsed);
          }
        } catch {
          // localStorage read failed, use current value
        }
        initializedFromFirestoreRef.current = true;
      }
    }, (err) => {
      console.warn('Firestore snapshot error:', err);
    });

    return () => {
      unsubscribe();
      flush();
    };
  }, [user, key, flush]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => flush();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flush]);

  return [value, setValueAndSync];
}
