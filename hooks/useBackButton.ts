"use client";

import { useEffect, useRef } from 'react';

/**
 * Pushes a dummy state to the history when the modal opens,
 * and intercepts the browser back button to close the modal
 * instead of navigating away.
 */
export function useBackButton(isOpen: boolean, onClose: () => void) {
  const isPoppedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state to intercept the back button
    window.history.pushState({ modalOpen: true }, '');
    isPoppedRef.current = false;

    const handlePopState = (e: PopStateEvent) => {
      isPoppedRef.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // If the component unmounts for a reason other than the back button
      // (like clicking the manual close button), we should clean up the history stack.
      if (!isPoppedRef.current) {
        // Go back once to remove the state we pushed
        window.history.go(-1);
      }
    };
  }, [isOpen, onClose]);
}
