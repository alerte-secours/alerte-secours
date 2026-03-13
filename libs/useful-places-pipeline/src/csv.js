// RFC 4180 compliant CSV parser (synchronous, in-memory)

function splitCsvRow(line, delimiter) {
  const fields = []
  let i = 0
  while (i <= line.length) {
    if (i === line.length) {
      fields.push("")
      break
    }
    if (line[i] === '"') {
      // Quoted field: collect until closing quote (doubled quotes "" are escapes)
      let value = ""
      i++ // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            value += '"'
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          value += line[i]
          i++
        }
      }
      fields.push(value.trim())
      // skip delimiter after quoted field
      if (i < line.length && line[i] === delimiter) i++
    } else {
      // Unquoted field
      const next = line.indexOf(delimiter, i)
      if (next === -1) {
        fields.push(line.slice(i).trim())
        break
      }
      fields.push(line.slice(i, next).trim())
      i = next + 1
    }
  }
  return fields
}

function parseCsvSync(content, delimiter = ";") {
  let input = content
  // BOM removal
  if (input.charCodeAt(0) === 0xfeff) input = input.slice(1)
  if (!input.trim()) return []

  // Parse rows handling multiline quoted fields (RFC 4180 compliant)
  const rows = []
  let currentLine = ""
  let inQuotes = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          currentLine += '""'
          i++ // skip escaped quote
        } else {
          inQuotes = false
          currentLine += ch
        }
      } else {
        currentLine += ch
      }
    } else if (ch === '"') {
      inQuotes = true
      currentLine += ch
    } else if (ch === "\r") {
      // skip \r, handle \n next
    } else if (ch === "\n") {
      if (currentLine.trim()) rows.push(currentLine)
      currentLine = ""
    } else {
      currentLine += ch
    }
  }
  if (currentLine.trim()) rows.push(currentLine)

  if (rows.length === 0) return []

  const headers = splitCsvRow(rows[0], delimiter)
  const records = []

  for (let i = 1; i < rows.length; i++) {
    const values = splitCsvRow(rows[i], delimiter)
    const record = {}
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || ""
    }
    records.push(record)
  }
  return records
}

module.exports = { splitCsvRow, parseCsvSync }
