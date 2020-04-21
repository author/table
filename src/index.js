export default class Table {
  #rows // Initialized in constructor
  #cols = new Map()
  #align = []
  #widths = []
  #tableWidth // Initialized in constructor
  #max = Infinity
  #cellspacing = 0
  #margin // Initialized in constructor, [left, right, top, bottom]
  #truncate = []
  #emptyCols = []
  #originalColumns = []
  #fillChar = ' '
  #fill = (count = 0, char = null) => new Array(count).fill(char || this.#fillChar).join('')
  #pad = (content, width, position = 'right', char = null) => {
    char = char || this.#fillChar

    if (content.length >= width) {
      return content
    }

    let fill = width - content.length

    switch (position) {
      case 'center':
        let extra = fill % 2
        fill = Math.floor(fill / 2)
        return this.#fill(fill, char) + content + this.#fill(fill + extra, char)

      case 'left':
        return this.#fill(fill, char) + content

      default:
        return content + this.#fill(fill, char)
    }
  }
  #truncateColumn = (content, width) => {
    if (width <= 0) {
      ['']
    }

    if (content.length <= width) {
      return [content]
    }

    return [content.substring(0, width + 1)]
  }

  constructor(rows = [], align = [], maxWidths = [], tableWidth = 80, margins = [0, 0, 0, 0]) {
    const expandall = (maxWidths || []).length === 0

    this.#rows = rows || []
    this.#align = align || []
    this.#widths = maxWidths || []
    this.#margin = (margins || [0, 0, 0, 0]).map(m => m < 0 ? 0 : m)

    for (let i = margins.length; i < 4; i++) {
      this.#margin.push(0)
    }

    this.#tableWidth = (tableWidth || 80) - (this.#margin[0] + this.#margin[1])

    // Calculate the row/col matrix
    let columns = this.#rows.reduce((max, row) => row.length > max ? row.length : max, 0)
    // columns = this.#align.length > columns ? this.#align.length : columns
    // columns = this.#widths.length > columns ? this.#widths.length : columns

    // Remove empty columns
    const emptyColumns = new Array(columns).fill(0).map((c, i) => i)
    this.#originalColumns = emptyColumns // Archive the original columns (used internally with truncation)
    for (let row of this.#rows) {
      row.forEach((content, col) => {
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
        this.#align = new Array(this.#rows[0].length).fill('l')
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

    if (expandall || this.#widths.length === 0) {
      defaultWidth = Math.floor(this.#tableWidth / columns)
      extra = this.#tableWidth % columns
    } else {
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

  get columns () {
    return this.#cols
  }

  get columnCount () {
    return this.#cols.size
  }

  get rows () {
    return this.#rows
  }

  get rowCount () {
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
      col.lines.forEach(line => { 
        const text = this.#truncate.indexOf(i) >= 0
          ? this.#truncateColumn(line, col.width)
          : this.wrap(line, col.width, col.align)
        lines = [...lines, ...text] 
      })
      col.lines = lines
      height = lines.length > height ? lines.length : height
    })

    // Adjust wrapped columns
    this.#cols.forEach((col, i) => {
      this.#cols.forEach((otherCol, ii) => {
        while (i !== ii && otherCol.lines.length < height) {
          otherCol.lines.splice(otherCol.lines.length - 1, 0, this.#fill(otherCol.width))
        }
      })
    })

    // Generate the table
    let rows = []
    const cellspacing = this.#fill(this.#cellspacing, ' ')
    let space = 0
    this.#cols.forEach((col, colNum) => {
      col.lines.forEach((line, num) => rows[num] = (rows[num] || '') + line + (colNum !== this.#cols.size - 1 ? cellspacing : ''))
      for (let i = col.lines.length; i < height; i++) {
        rows[i] = this.#fill(space + col.width, ' ')
      }
      space += col.width
    })

    if (this.#margin.reduce((a, m) => { a += m; return a }, 0) > 0) {
      rows = rows.map(row => {
        this.#margin.forEach((margin, i) => {
          switch (i) {
            case 0: // left
              row = `${this.#fill(margin)}${row}`
              break
            case 1: // right
              row = `${row}${this.#fill(margin)}`
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
    for (let i = 0; i < this.#margin[2]; i++) {
      rows.push('')
    }

    return rows.join('\n')
  }

  wrap (content, width, align = 'right') {
    align = align.toLowerCase()

    // Reverse the alignment, since the padding uses "position" instead of "alignment"
    align = align === 'c' ? 'center' : (align === 'r' ? 'left' : 'right')

    if (content.length <= width) {
      return [this.#pad(content.trim(), width, align, this.#fillChar)]
    }

    const result = content.match(this.match(width)) || []
    const remainder = content.substring(result.join('').length)

    if (remainder.length > 0) {
      result.push(remainder)
    }

    return result.map(el => this.#pad(el.trim(), width, align, this.#fillChar))
  }

  match (width) {
    return new RegExp(`(.{0,${width}})[\\s\\n\\.\\,\\;\\:]`, 'g')
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
