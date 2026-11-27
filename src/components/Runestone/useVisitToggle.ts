import { useEffect, useState } from 'react';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';
import type { Runestone } from '../../types';

// Visited toggle shared by the map modal and the detail page. Call from an observer component.
export function useVisitToggle(runestone: Runestone | null) {
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = runestone?.id;

  // Don't carry an error over to a different runestone
  // biome-ignore lint/correctness/useExhaustiveDependencies: must reset on runestone change
  useEffect(() => {
    setError(null);
  }, [id]);

  const isVisited = id !== undefined && visitedRunestonesStore.isRunestoneVisited(id);
  const isUpdating =
    isMarking || (id !== undefined && visitedRunestonesStore.isRunestoneUpdating(id));

  const toggle = async () => {
    if (id === undefined || isUpdating) return;
    setIsMarking(true);
    setError(null);
    // The store reports failures through its return value and never throws.
    const ok = isVisited
      ? await visitedRunestonesStore.unmarkAsVisited(id)
      : await visitedRunestonesStore.markAsVisited(id);
    if (!ok) setError('Failed to update visited status. Please try again.');
    setIsMarking(false);
  };

  return { isVisited, isUpdating, error, toggle };
}
