/**
 * Throttle a list of promises to control concurrency
 * @param promises Array of promises to execute
 * @param limit Maximum number of concurrent promises
 * @returns Promise that resolves with array of results
 */
export function throttlePromises<T>(promises: Promise<T>[], limit: number): Promise<T[]> {
  return new Promise((resolve) => {
    if (!promises.length) {
      resolve([]);
      return;
    }

    const results: T[] = [];
    let index = 0;
    let done = 0;

    function next() {
      if (index >= promises.length) return;
      
      const currentIdx = index++;
      const promise = promises[currentIdx];
      
      promise.then(result => {
        results[currentIdx] = result;
        done++;
        
        if (done === promises.length) {
          resolve(results);
        } else {
          next();
        }
      }).catch(err => {
        console.error('Error in throttled promise:', err);
        results[currentIdx] = {} as T; // Placeholder for error case
        done++;
        
        if (done === promises.length) {
          resolve(results);
        } else {
          next();
        }
      });
    }

    // Start initial batch of promises
    for (let i = 0; i < Math.min(limit, promises.length); i++) {
      next();
    }
  });
}
