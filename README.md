# @author.io/table

The table module generates nicely formatted/align text (UTF8) based tables. It was designed for use with [@author.io/shell](https://github.com/author/shell), but it is a generic library that can be used in any type of text application. It works across runtimes (Node.js, browsers), contains unit tests and source maps, and is available via popular CDN's. It has no dependencies and remaining lightweight is a key priority of this library (there are many other text table formatting libraries that do everything under the sun).

**Example:**

```javascript
const rows = [
  ['Column 1', 'Column 2', 'Column 3'],
  ['test', '[-o, -opt]', 'This is an example, using a run-on sentence that should break onto a separate line or multiple lines depending on the table with specified.'],
  ['cmd', '', 'Another command description.']
]

const table = new Table(rows)

console.log(table.output)
```

**The default output:**

```sh
Column 1                  Column 2                  Column 3                    
test                      [-o, -opt]                This is an example, using a 
                                                    run-on sentence that should 
                                                    break onto a separate line  
                                                    or multiple lines depending 
                                                    on the table with specified.
cmd                                                 Another command description.
```

## Installation & Usage

### For Modern Node (ES Modules)

`npm install @author.io/node-table`

Please note, you'll need a verison of Node that supports ES Modules. In Node 12, this feature is behind the `--experimental-modules` flag. It is available in Node 13+ without a flag, but your `package.json` file must have the `"type": "module"` attribute. This feature will be generally available in Node 14.0.0 (release date April 21, 2020).

### For Legacy Node (CommonJS/require)

If you need to use the older CommonJS format (i.e. `require`), run `npm install @author.io/node-table-legacy` instead.

### For Browsers

**CDN**

```javascript
import Table from 'https://cdn.pika.dev/@author.io/browser-table'
```

Also available from [jsdelivr](https://www.jsdelivr.com/?query=%40author.io%2Ftable) and [unpkg](https://unpkg.com/@author.io/browser-table).

**npm options**

If you wish to bundle this library in your build process, use the version most appropriate for your target runtimes:

- `npm install @author.io/table` (source)
- `npm install @author.io/browser-table` (Minified ES Module)
- `npm install @author.io/browser-table-es6` (IIFE Minified Module - globally accessible)

### Debugging

Each distribution has a corresponding `-debug` version that should be installed _alongside_ the main module (the debugging is an add-on module). For example, `npm install @author.io/node-table-debug --save-dev` would install the debugging code for Node.

---

## Default configuration

Each of these are modifiable using methods and/or configuration parameters (detailed below).

1. _80 characters wide._
1. _Equally distributed column widths._
1. _Left aligned columns._
1. _No cellspacing._
1. _No table margins._
1. _Long content is wrapped._

**All _empty columns are stripped_. Here's why:**

There is no need for an empty column. 

**_But... I want an empty column!_**
Blank columns usually have a header. This is different from an empty column, which has NO content. For example:

```sh
Column 1                  Column 2                  Column 3                    
test                                                This is an example... 
test2                                               This is an example... 
test3                                               This is an example... 
```

`Column 2` is _blank_. If there were no header, it would be considered "empty".

**_But, but... I want to use an empty column as a spacer!_**
Use cellspacing to create space separation between columns.

**_But, but, BUT... I want to use an empty column to add space to a SPECIFIC column!_**
To add space before/after a specific column, pad the content.

## Customizing Output

The table class accepts several configuration options.

```javascript
new Table(rows, columnAlignment, columnWidths, tableWidth, tableMargins)
```

### Rows (required)

This is an array of arrays. The main array contains rows. Each "subarray" contains the column data.

_Example:_
```javascript
[
  ['Column 1', 'Column 2', 'Column 3'], // Row 1
  ['Column 1', 'Column 2', 'Column 3'], // Row 2
  ['Column 1', 'Column 2', 'Column 3']  // Row 3
]
```

### Column Alignment

This is an array of characters, where each character represents alignment of a column.

_Example:_

```javascript
[
  'l', // Left align column 1
  'c', // Center align column 2
  'r'  // Right align column 3
]
```

### Column Widths

This is an array of numbers or strings. Each value represents the width of a column. A number represents how many characters wide the column will be. A string can represent a percentage, such as `50%` to represent half the width of the total table. It's possible to mix these, but isn't thoroughly tested. As a result, it's recommended to use one or other instead of mixing percentages with explicit numeric widths.

_Percentage Example: (Assume an 80 character-wide table)_

```javascript
[
  '20%', // Column 1 will be 16 characters wide
  '20%', // Column 2 will be 16 characters wide
  '60%'  // Column 3 will be 48 characters wide
]
```

_Numeric Example: (Assume an 80 character-wide table)_

```javascript
[
  16, // Column 1 will be 16 characters wide
  16, // Column 2 will be 16 characters wide
  48  // Column 3 will be 48 characters wide
]
```

### Table Width

This is the maximum width of the table, in characters. Default is 80.

_Examples:_
```javascript
const table = new Table(rows, null, null, 80, null)
```

### Table Margins

It is possible to add spacing around the table.

The syntax is:

```javascript
[<left>[, <right>][, <top>][, <bottom>]]
```

Everything is available. All unspecified values default to `0`.

_Example:_
```javascript
[
  2, // Left margin will be 2 empty spaces
  2, // Right margin will be 2 empty spaces
  1, // Top margin will be 1 empty spaces
  1  // Bottom margin will be 1 empty spaces
]
```

This is represented as you would expect (borders for illustration purposes only):

```sh
--------------------------
|           Top          |
|  --------------------  |
|L |                  |R |
|e |       Table      |i |
|f |  (76 chars wide) |g |
|t |                  |h |
|  |                  |t |
|  --------------------  |
|          Bottom        |
--------------------------
```

## Advanced Formatting Options

In addition to basic arguments, there are several other settings/methods to help customize the output.

### Cellspacing

Cellspacing is a number of characters applied after every column except the last one. By default, there is no cellspacing (i.e. `0`).

**WARNING: This will expand the width of your table!** (Calculate accordingly)

_Example:_

```javascript
const rows = [
  ['a', 'b'],
  ['c', 'd']
]

const table = new Table(rows, null, null, 4)
table.cellspacing = 2
```

_Output:_
```sh
# Spaces represented by underscores for illustration purposes
a___b_
c___d_
```

The cellspacing is then injected at the end of each column (except the last).

If cellspacing had _not_ been defined, the output would have looked like:

```sh
a_b_
c_d_
```

The output above is 4 characters wide. There would be a space after `b` and `d` since the table is 4 characters wide and left aligned (each column is 2 characters wide, but with no cellspacing).

### Custom Fill Character

In most cases, using a space is the best custom fill character. However; it is possible to modify this using the `fill` property. We don't really see many use cases for this (other than leader lines), but it's there if you need it.

_Example:_

```javascript
const rows = [
  ['a', 'b'],
  ['c', 'd']
]

const table = new Table(rows, null, null, 10)

table.fill = '*'

console.log(table.output)
```

_Output:_
```sh
a****b****
c****d****
```

### Wrapping & Truncating Long Text

By default, long text is wrapped in a column. It is possible to truncate one or more columns instead of wrapping text.

_1. To truncate all columns:_

```javascript
const table = new Table(rows)
table.truncate()
```

_2. To truncate specific columns: (uses a 1-based column index)_

```javascript
const table = new Table(rows)
table.truncate(2, 4) // Truncate column #2 and column #4
```

_3. Clear truncation:_

```javascript
const table = new Table(rows)
table.truncate(0) // Anything 0 or less
```

**NOTICE** there is no way to modify truncation properties of a specific column. If you need to "modify", clear truncation and reset (i.e. use example 3, then example 2).

## Additional Properties

The class has 4 read-only properties:

1. `columns` - the raw column map
1. `columnCount` - The number of columns.
1. `rows` - The raw row object, updated with appropriate formatting.
1. `rowCount` - the number of rows.

```javascript
const table = new Table(rows)

console.log(table.rowCount, table.columnCount)
```

## Credits

Created by [Corey Butler](https://github.com/coreybutler) for [Author.io](https://author.io).

**Sponsors (as of 2020)**

<table cellpadding="10" cellspacing="0" border="0">
  <tr>
    <td><a href="https://metadoc.io"><img src="https://github.com/coreybutler/staticassets/raw/master/sponsors/metadoclogobig.png" width="200px"/></a></td>
    <td><a href="https://butlerlogic.com"><img src="https://github.com/coreybutler/staticassets/raw/master/sponsors/butlerlogic_logo.png" width="200px"/></a></td>
  </tr>
</table>