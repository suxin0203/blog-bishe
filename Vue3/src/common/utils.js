function globalThrottle(func, delay) {
    let lastExecuted = 0;
    let timeoutId = null;
  
    return function (...args) {
      const now = Date.now();
  
      if (now - lastExecuted >= delay) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
  
        lastExecuted = now;
        func(...args);
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastExecuted = Date.now();
          func(...args);
          timeoutId = null;
        }, delay - (now - lastExecuted));
      }
    };
  }
  export default globalThrottle;
  