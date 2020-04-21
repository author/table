import SimpleCalculator from './lib/calc.js'

const calc = new SimpleCalculator()

export default class Calculator {
  static add () {
    return calc.summation(...arguments)
  }

  static avg () {
    return calc.average(...arguments)
  }

  static get env () {
    return calc.env
  }
}
