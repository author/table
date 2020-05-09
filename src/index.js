const cut = (content, width, re) => {
  if (width < 1) {
    throw new Error('Width must be at least 1.')
  }
  let result = [content.substring(0, width)]
  content = content.substring(width)
  
  if (content.length > width) {
    const matches = content.match(re) || []
    let remainder = content.substring(matches.join('').length)

    if (matches.length > 0) {
      result = result.concat(matches)
    }

    if (remainder.length > 0 && remainder.length > width) {
      if (maxMatch.test(remainder)) {
        result = result.concat(cut(remainder, width))
      } else {
        let i = 0
        console.log(remainder.length, width)
        while (remainder.length > 0 && i < 20) {
          i++
          if (remainder.length <= width) {
            result.push(remainder)
            remainder = ''
          } else {
            result.push(remainder.substring(0, width))
            remainder = remainder.substring(width)
            console.log('>>>',remainder, result)
          }
          
        }
      }
    } else if (remainder > 0) {
      result.push(remainder)
    }
  }

  return result
}

const pad = (content, width, position = 'right', char = ' ') => {
  if (content.length >= width) {
    return content
  }

  switch (position) {
    case 'center':
      return content.padStart(Math.floor(content.length / 2), char).padEnd(width, char)

    case 'left':
      return content.padStart(width, char)

    default:
      return content.padEnd(width, char)
  }
}

const fill = (count = 0, char = ' ') => char.repeat(count)

const truncateColumn = (content, width) => {
  if (width <= 0) {
    ['']
  }

  if (content.length <= width) {
    return [content]
  }

  return [content.substring(0, width + 1)]
}

const match = width => {
  return new RegExp(`(.{0,${width}})[\\s\\n\\t(\\.\\s)]`, 'g')
}

const maxMatch = match(2000)

export default class Table {
  #rows // Initialized in constructor
  #cols = new Map()
  #align = []
  #widths = []
  #tableWidth // Initialized in constructor
  #tabWidth = 2
  #max = Infinity
  #cellspacing = 0
  #margin // Initialized in constructor, [left, right, top, bottom]
  #truncate = []
  #emptyCols = []
  #originalColumns = []
  #RE = new Map()
  #fillChar = ' '
  
  #cleanText = content => {
    content = content.replace(/\t/g, fill(this.#tabWidth))
    const pattern = [
      '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
      '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
      '\\x1B[[(?);]{0,2}(;?\\d)*.',
      '\\033(\\[(\\[H\\033\\[2J|\\d+;\\d+H|\\d+(;\\d+;\\d+(;\\d+;\\d+)?m|[mABCDFGd])|[HJK]|1K)|[78]|\\d*[PMX]|\\(B\\033\\[m)'
    ].join('|');

    return content.replace(new RegExp(pattern, 'g'), '')
  }

  #expandall

  #prepared = false
  #prepare = () => {
    if (this.#prepared) {
      return
    }

    this.#prepared = true

    // Calculate the row/col matrix
    let columns = this.#rows.reduce((max, row) => row.length > max ? row.length : max, 0)
    // columns = this.#align.length > columns ? this.#align.length : columns
    // columns = this.#widths.length > columns ? this.#widths.length : columns

    // Remove empty columns
    const emptyColumns = new Array(columns).fill(0).map((c, i) => i)
    this.#originalColumns = emptyColumns // Archive the original columns (used internally with truncation)
    for (let row of this.#rows) {
      row.forEach((content, col) => {
        content = this.#cleanText(content)

        if (emptyColumns.indexOf(col) >= 0 && content !== null && content !== undefined && typeof content === 'string' && content.trim().length > 0) {
          emptyColumns.splice(emptyColumns.indexOf(col), 1)
        }
      })

      if (emptyColumns.length === 0) {
        break
      }
    }

    columns = columns - emptyColumns.length

    if (columns === 0) {
      return
    }

    if (emptyColumns.length > 0) {
      this.#emptyCols = emptyColumns
      this.#rows = this.#rows.map(row => row.filter((r, col) => emptyColumns.indexOf(col) < 0))
    }

    // Supply default alignments
    if (this.#align.length === 0) {
      if (this.#widths.length > 0) {
        this.#align = new Array(this.#widths.length).fill('l')
      } else {
        this.#align = new Array(this.#rows[0].length - emptyColumns.length).fill('l')
      }
    }

    for (let i = this.#align.length; i < columns; i++) {
      this.#align.push('l')
    }

    // Calculate width limits
    let defaultWidth = -1
    let extra = 0
    const expandableColumns = new Set(
      this.#widths.length === 0
        ? new Array(this.#align.length).map((nil, i) => i)
        : new Array(this.#align.length - this.#widths.length).map((nil, i) => i)
    )

    if (this.#expandall || this.#widths.length === 0) {
      defaultWidth = Math.floor(this.#tableWidth / columns)
      extra = this.#tableWidth % columns
    } else {
      this.#widths = this.#widths.filter((w, i, a) => emptyColumns.indexOf(i) < 0)
      this.#widths.forEach((w, i, a) => {
        if (typeof w === 'string' && w.substring(w.length - 1) === '%') {
          const pct = parseFloat(w.replace(/[^0-9]+/g, '')) / 100
          a[i] = Math.ceil(this.#tableWidth * pct)
        }
      })

      const remainingSpace = this.#tableWidth - this.#widths.reduce((acc, width) => { acc += width; return acc }, 0)
      defaultWidth = Math.floor(remainingSpace / (columns - this.#widths.length))
      if (remainingSpace > 0) {
        extra = remainingSpace % (columns - this.#widths.length)
      }
    }

    for (let i = this.#widths.length; i < columns; i++) {
      this.#widths.push(defaultWidth)
    }

    this.#widths[this.#widths.length - 1] += extra

    let start = 0
    this.#rows.forEach(row => {
      row.forEach((columnContent, i) => {
        let data = this.#cols.get(i) || {
          align: this.#align[i] || 'l',
          width: this.#widths[i] || -1,
          start,
          contentLength: 0,
          lines: []
        }

        start += data.width

        data.lines.push(columnContent)

        if (columnContent.length > data.contentLength) {
          data.contentLength = columnContent.length
        }

        this.#cols.set(i, data)
      })
    })
  }

  constructor(rows = [], align = [], maxWidths = [], tableWidth = 80, margins = [0, 0, 0, 0]) {
    const cfg = typeof rows === 'object' && !Array.isArray(rows) ? rows : {}

    if (cfg.hasOwnProperty('rows')) { rows = cfg.rows }
    if (cfg.hasOwnProperty('align')) { align = cfg.align }
    if (cfg.hasOwnProperty('maxWidths')) { maxWidths = cfg.maxWidths }
    if (cfg.hasOwnProperty('tableWidth')) { tableWidth = cfg.tableWidth }
    if (cfg.hasOwnProperty('margins')) { margins = cfg.margins }
    
    this.#expandall = (maxWidths || []).length === 0
    this.#rows = rows || []
    this.#align = align || []
    this.#widths = maxWidths || []
    this.#margin = (margins || [0, 0, 0, 0]).map(m => m < 0 ? 0 : m)

    for (let i = margins.length; i < 4; i++) {
      this.#margin.push(0)
    }

    this.#tableWidth = (tableWidth || 80) - (this.#margin[0] + this.#margin[1])
  }

  get columns () {
    !this.#prepared && this.#prepare()
    return this.#cols
  }

  get columnCount () {
    !this.#prepared && this.#prepare()
    return this.#cols.size
  }

  get rows () {
    !this.#prepared && this.#prepare()
    return this.#rows
  }

  get rowCount () {
    !this.#prepared && this.#prepare()
    return this.#rows.length
  }

  // set width(value) {
  //   this.#max = value < 10 ? 10 : value
  // }

  set cellspacing (value) {
    this.#cellspacing = value <= 0 ? 0 : value
  }

  set fill (value) {
    this.#fillChar = value.substring(0, 1)
  }

  get output() {
    if (!this.#prepared) {
      this.#prepare()
    }

    if (this.#cellspacing > 0) {
      this.#cols.forEach((col, i) => {
        if (i < col.size - 1) {
          col.width = col.width - this.#cellspacing
        }
      })
    }

    // Generate wrapped lines and identify the maximum column height (in rows)
    let height = 0
    this.#cols.forEach((col, i) => {
      let lines = []
      col.rows = []
      col.lines.forEach(line => {
        let w = col.width < 0 ? col.contentLength : col.width
        const text = this.#truncate.indexOf(i) >= 0
          ? truncateColumn(line, w)
          : this.wrap(line, w, col.align)
        lines = [...lines, ...text] 
        col.rows.push(text.length)
      })
      col.lines = lines
      height = lines.length > height ? lines.length : height
    })

    // Adjust wrapped columns
    if (this.#rows.length > 1) {
      this.#cols.forEach((col, i) => {
        this.#cols.forEach((otherCol, otherColumnNumber) => {
          if (i !== otherColumnNumber) {
            let accruedLines = 0
            
            col.rows.forEach(lines => {
              if (lines > 1) {
                for (let line = 1; line < lines; line++) {
                  otherCol.lines.splice(accruedLines + 1, 0, fill(otherCol.width))
                }
              }

              accruedLines += lines
            })
          }
        })
      })
    }

    // Generate the table
    let rows = []
    const cellspacing = fill(this.#cellspacing, ' ')
    let space = 0
    this.#cols.forEach((col, colNum) => {
      col.lines.forEach((line, num) => rows[num] = (rows[num] || '') + line + (colNum !== this.#cols.size - 1 ? cellspacing : ''))
      for (let i = col.lines.length; i < height; i++) {
        rows[i] = fill(space + col.width, ' ')
      }
      space += col.width
    })

    if (this.#margin.reduce((a, m) => { a += m; return a }, 0) > 0) {
      rows = rows.map(row => {
        this.#margin.forEach((margin, i) => {
          switch (i) {
            case 0: // left
              row = `${fill(margin)}${row}`
              break
            case 1: // right
              row = `${row}${fill(margin)}`
              break
          }
        })

        return row
      })
    }

    // Top margin
    for (let i = 0; i < this.#margin[2]; i++) {
      rows.unshift('')
    }

    // Bottom margin
    for (let i = 0; i < this.#margin[3]; i++) {
      rows.push('')
    }

    return rows.join('\n')
  }

  wrap (content, width, align = 'right') {
    if (width < 1) {
      throw new Error('Width must be at least 1.')
    }
  
    align = align.toLowerCase()

    // Reverse the alignment, since the padding uses "position" instead of "alignment"
    align = align === 'c' ? 'center' : (align === 'r' ? 'left' : 'right')

    if (content.length <= width) {
      return [pad(content.trim(), width, align, this.#fillChar)]
    }

    let re = this.#RE.get(width)
    if (!re) {
      re = match(width)
      this.#RE.set(width, re)
    }
    let result = content.match(re) || []
    let remainder = content.substring(result.join('').length)

    if (remainder.length > width) {
      result = result.concat(cut(remainder, width, re))
    } else if (remainder.length > 0) {
      result.push(remainder)
    }

    return result.map(el => pad(el.trim(), width, align, this.#fillChar))
  }

  // Truncate the specified columns
  // If no arguments are specified, all columns are truncated.
  // Passing a null value or any number less than zero will
  // ignore truncation (i.e. everything will be wrapped text).
  truncate () {
    if (arguments.length === 0) {
      this.#truncate = new Array(this.#rows.length).fill(0).map((a, i) => i)
    }

    for (let arg of arguments) {
      if (arg <= 0) {
        this.#truncate = []
        return
      }
    }

    this.#truncate = Array.from(new Set([...this.#truncate, ...arguments]))
  }
}
