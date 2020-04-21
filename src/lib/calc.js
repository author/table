export default class Calculator {
  get env () {
    /* node-only */
    return `Node ${process.version}`
    /* end-node-only */
    /* browser-only */
    return 'Browser: ' + navigator.platform
    /* end-browser-only */
  }

  summation () {
    let total = 0
    Array.from(arguments).forEach(number => total += number)
    return total
  }

  average () {
    return this.summation(...arguments)/arguments.length
  }
}
