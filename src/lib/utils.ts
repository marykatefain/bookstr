
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debounce helper function
export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Throttle a batch of promise-returning functions to limit concurrency
 * @param promiseFunctions Array of functions that return promises
 * @param limit Maximum number of promises to execute concurrently
 * @returns Promise that resolves to an array of the results
 */
export const throttlePromises = async <T>(
  promiseFunctions: (() => Promise<T>)[],
  limit: number
): Promise<T[]> => {
  const results: T[] = [];
  let index = 0;

  // Helper function to process the next batch
  const runBatch = async (): Promise<void> => {
    const currentIndex = index++;
    if (currentIndex >= promiseFunctions.length) return;

    // Execute the current promise
    try {
      const result = await promiseFunctions[currentIndex]();
      results[currentIndex] = result;
    } catch (error) {
      console.error(`Error in throttled promise at index ${currentIndex}:`, error);
      results[currentIndex] = null as unknown as T;
    }

    // Process the next one
    await runBatch();
  };

  // Start `limit` number of batches
  const batchPromises = Array(Math.min(limit, promiseFunctions.length))
    .fill(0)
    .map(() => runBatch());

  // Wait for all batches to complete
  await Promise.all(batchPromises);
  
  return results;
};
