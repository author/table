import 'source-map-support/register.js'
import test from 'tape'
import Table from '../../.node/index.js'

const rows = [
  ['Column 1', 'Column 2', 'Column 3'],
  ['test', '[-o, -opt]', 'This is an example, using a run-on sentence that should break onto a separate line or multiple lines depending on the table with specified.'],
  ['cmd', '', 'Another command description.']
]

test('Truncate columns', t => {
  const table = new Table(rows)
  table.truncate()

  const out = `Column 1Column 2Column 3
test[-o, -opt]This is an example, using a r
cmdAnother command description.`

  t.ok(table.output === out, 'Generated truncated columns.')
  t.end()
})

test('Remove empty columns', t => {
  let table = new Table(rows)
  t.ok(table.columnCount === 3, `Correctly calculates the number of columns. Expected 3, recognized ${table.columnCount}`)

  rows.forEach((row, i) => {
    row.splice(1, 0, '', '')
    rows[i] = row
  })

  table = new Table(rows)
  t.ok(table.columnCount === 3, `Automatically strip empty columns. Expected 3, recognized ${table.columnCount}`)

  t.end()
})

test('Use Cellspacing', t => {
  const rows = [
    ['a', 'b'],
    ['c', 'd']
  ]

  const table = new Table(rows, null, null, 4)
  table.cellspacing = 2

  const out = `a   b 
c   d `
  t.ok(table.output === out, 'Generated truncated columns.')
  t.end()
})

test('Custom Fill', t => {
  const rows = [
    ['a', 'b'],
    ['c', 'd']
  ]

  const table = new Table(rows, null, null, 10)
  table.fill = '*'

  const out = `a****b****
c****d****`
  t.ok(table.output === out, 'Used specified character for fill.')
  t.end()
})
