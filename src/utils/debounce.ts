/**
 * Trailing-edge debounce with `flush()` and `cancel()`.
 *
 * - Trailing: a burst of calls collapses into one invocation, fired `wait` ms
 *   after the LAST call.
 * - `flush()`: run the pending call immediately (used by the pagehide handler).
 * - `cancel()`: drop the pending call entirely.
 *
 * Generic over `Args` (a tuple) so the stored args replay type-safely.
 */

export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number = 0,
) {
  let timeoutId: number | undefined = undefined;
  let pendingArgs: Args | undefined = undefined;

  function clearTimer() {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  function debounced(...args: Args) {
    pendingArgs = args;
    clearTimer();

    timeoutId = window.setTimeout(() => {
      timeoutId = undefined;
      if (pendingArgs !== undefined) {
        func(...pendingArgs);
        pendingArgs = undefined;
      }
    }, wait);
  }

  debounced.flush = () => {
    if (timeoutId !== undefined) {
      clearTimer();
      if (pendingArgs !== undefined) {
        func(...pendingArgs);
        pendingArgs = undefined;
      }
    }
  };

  debounced.cancel = () => {
    clearTimer();
    pendingArgs = undefined;
  };

  return debounced;
}
