type CsvRow = Record<string, string | number | boolean | null | undefined>

function escapeCSVValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Check if the value needs quoting (contains comma, quote, or newline)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape double quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

export function convertToCSV<T extends CsvRow>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return ''
  }

  // Determine columns from data if not provided
  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    label: key as string
  }))

  // Header row
  const header = cols.map(col => escapeCSVValue(col.label)).join(',')

  // Data rows
  const rows = data.map(row =>
    cols.map(col => escapeCSVValue(row[col.key])).join(',')
  )

  return [header, ...rows].join('\n')
}

export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}

export function exportToCSV<T extends CsvRow>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  const csvContent = convertToCSV(data, columns)
  downloadCSV(csvContent, filename)
}
