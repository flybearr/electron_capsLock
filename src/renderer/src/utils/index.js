export const debounce = (callback, delay = 500) => {
  let timeout = null
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      callback(...args)
    }, delay)
  }
}

// debounce.cancel = () => {
//     console.log(timeout);
    
//   if (timeout) {
//     clearTimeout(timeout)
//   }
// }
