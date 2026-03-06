 // 节流
export function _throttle(fn, interval = 1000) {
    let last
    let timer
    return function() {
      const th = this
      const args = arguments
      const now = +new Date()
      if (last && now - last < interval) {
        clearTimeout(timer)
        timer = setTimeout(function() {
          last = now
          fn(th, args)
        }, interval)
      } else {
        last = now
        fn.apply(th, args)
      }
    }
  }
   
  // 防抖
  export function _debounce(fn, delay = 500) {
    let timer
    return function() {
      const th = this
      const args = arguments
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(function() {
        timer = null
        fn.apply(th, args)
      }, delay)
    }
  }