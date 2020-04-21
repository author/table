import 'source-map-support/register.js'
import test from 'tape'
import Table from '../../.node/index.js'

const rows = [
  ['Column 1', 'Column 2', 'Column 3'],
  ['test', '[-o, -opt]', 'This is an example, using a run-on sentence that should break onto a separate line or multiple lines depending on the table with specified.'],
  ['cmd', '', 'Another command description.']
]

const basicOutput = `Column 1                  Column 2                  Column 3                    
test                      [-o, -opt]                This is an example, using a 
                                                    run-on sentence that should 
                                                    break onto a separate line  
                                                    or multiple lines depending 
                                                    on the table with specified.
cmd                                                 Another command description.`

test('Sanity Testing', t => {
  t.ok(typeof Table === 'function', 'Table is class available.')

  const table = new Table(rows)
  t.ok(table instanceof Table, 'Table instantiated correctly.')
  // t.ok(ta, 'Table instantiated correctly.')

  t.ok(table.output === basicOutput, 'Default output is formatted correctly.')
  t.end()
})
