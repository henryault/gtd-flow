import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Drop-in replacement for useLocalStorage that syncs with Firestore.
 * Same API: useFirestoreStorage(key, initialValue) → [value, setValue]
 *
 * - Writes to localStorage synchronously (instant local persistence)
 * - Writes to Firestore debounced at 500ms (cross-device sync)
 * - Reads via onSnapshot (real-time cross-device sync)
 * - Migrates existing localStorage data on first sign-in
 */
export function useFirestoreStorage(key, initialValue) {
  const { user } = useAuth();

  // Initialize from localStorage for instant load
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

  // Write to localStorage synchronously (survives tab close)
  const writeToLocalStorage = useCallback((val) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.warn('localStorage write error:', err);
    }
  }, [key]);

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

  // Custom setter: localStorage (sync) + Firestore (debounced)
  const setValueAndSync = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeToLocalStorage(next);
      writeToFirestore(next);
      return next;
    });
  }, [writeToLocalStorage, writeToFirestore]);

  // Subscribe to Firestore changes (real-time sync from other devices)
  useEffect(() => {
    if (!user) {
      hasMigratedRef.current = false;
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'data', key);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const firestoreValue = snapshot.data().value;
        // Only update from remote changes (not our own pending writes)
        if (!snapshot.metadata.hasPendingWrites) {
          setValue(firestoreValue);
          valueRef.current = firestoreValue;
          writeToLocalStorage(firestoreValue);
        }
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
      }
    }, (err) => {
      console.warn('Firestore snapshot error:', err);
    });

    return () => {
      unsubscribe();
      flush();
    };
  }, [user, key, flush, writeToLocalStorage]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => flush();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flush]);

  return [value, setValueAndSync];
}
