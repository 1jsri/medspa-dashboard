import { google } from 'googleapis'
import type { BookedCallRow, SaleSubmissionRow, RawSheetsData } from '@/types/sheets'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

// Check if Google Sheets credentials are configured
export function hasGoogleCredentials(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const bookedCallsSheetId = process.env.BOOKED_CALLS_SHEET_ID
  const salesSheetId = process.env.SALES_SHEET_ID

  return !!(email && privateKey && bookedCallsSheetId && salesSheetId)
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('Missing Google Sheets credentials')
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  })
}

async function getSheetData(spreadsheetId: string, range: string): Promise<string[][]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return (response.data.values as string[][]) || []
}

// Get all sheet names from a spreadsheet
async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  })

  return response.data.sheets?.map(sheet => sheet.properties?.title || '') || []
}

// Helper functions matching excel-reader.ts
function normalizeString(value: string | undefined | null): string {
  if (!value) return ''
  return String(value).trim()
}

function combineNames(firstName: string | undefined, lastName: string | undefined): string {
  const first = normalizeString(firstName)
  const last = normalizeString(lastName)
  return [first, last].filter(Boolean).join(' ')
}

function parsePrice(value: string | number | undefined): number {
  if (!value) return 0
  if (typeof value === 'number') return value
  // Remove currency symbols, commas, and spaces
  const cleaned = String(value).replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Extract year from tab name: "June" -> 2025, "January 26" -> 2026
function getYearFromTabName(tabName: string): number {
  if (tabName.includes('26')) return 2026
  if (tabName.includes('25')) return 2025
  // Default: tabs like "June", "July" etc are from 2025
  return 2025
}

function parseDate(value: string | number | undefined, yearHint?: number): string {
  if (!value) return ''

  const targetYear = yearHint || 2025

  // Handle numeric serial dates (Google Sheets returns these)
  // Excel/Sheets serial: days since Dec 30, 1899
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const numValue = typeof value === 'number' ? value : Number(value)
    // Only treat as serial number if it's a reasonable range (>= 1 and looks like a date serial)
    // Date serials are typically 5-digit numbers (e.g., 45678 = ~2025)
    if (numValue >= 1 && numValue < 100000) {
      const date = new Date((numValue - 25569) * 86400 * 1000)
      if (!isNaN(date.getTime())) {
        // Get month and day from the serial date, but use the year hint
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${targetYear}-${month}-${day}`
      }
    }
  }

  // Handle string dates like "June 30th"
  const cleaned = String(value).replace(/(\d+)(st|nd|rd|th)/i, '$1').trim()

  // Try parsing as a date
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    // If the parsed year is reasonable (2020+), use it; otherwise use yearHint
    const parsedYear = parsed.getFullYear()
    const year = parsedYear >= 2020 ? parsedYear : targetYear
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // If no year in the string, use the year hint
  const withYear = new Date(cleaned + ', ' + targetYear)
  if (!isNaN(withYear.getTime())) {
    const month = String(withYear.getMonth() + 1).padStart(2, '0')
    const day = String(withYear.getDate()).padStart(2, '0')
    return `${targetYear}-${month}-${day}`
  }

  return ''
}

// Column mapping types matching excel-reader.ts
interface BookedCallsColumnMapping {
  firstName: number
  lastName: number
  dateOfCall: number
  packagePurchase: number
  expectedPrice: number
  closedStatus: number
  callStatus: number
  reschedules: number
  closer?: number
  currency?: number
  vibe?: number
  objection?: number
  lastContact?: number
  lastContactNotes?: number
  city?: number
  state?: number
}

interface SalesColumnMapping {
  firstName: number
  lastName: number
  clientEmail: number
  phone: number
  admissionsCallDate: number
  purchaseDate: number
  program: number
  price: number
  cashCollected: number
  currency: number
  balance: number
  paymentSource: number
  salesRep: number
  setter: number
  paymentStatus?: number
}

function detectBookedCallsColumns(headers: (string | undefined)[]): BookedCallsColumnMapping | null {
  const mapping: Partial<BookedCallsColumnMapping> = {}

  headers.forEach((header, index) => {
    if (!header) return
    const h = header.toLowerCase().trim()

    if (h === 'client first name') mapping.firstName = index
    else if (h === 'client last name') mapping.lastName = index
    else if (h === 'date of call') mapping.dateOfCall = index
    else if (h === 'package/purchase') mapping.packagePurchase = index
    else if (h === 'expected price') mapping.expectedPrice = index
    else if (h === 'closed?') mapping.closedStatus = index
    else if (h === 'call status') mapping.callStatus = index
    else if (h.includes('how many reschedules')) mapping.reschedules = index
    else if (h === 'closer?' || h === 'closer') mapping.closer = index
    else if (h === 'cad/usd') mapping.currency = index
    else if (h === 'vibe') mapping.vibe = index
    else if (h === 'objection') mapping.objection = index
    else if (h === 'last contact' || h === 'last contact date') mapping.lastContact = index
    else if (h === 'last contact notes') mapping.lastContactNotes = index
    else if (h === 'city') mapping.city = index
    else if (h === 'state' || h === 'state/province' || h === 'province') mapping.state = index
  })

  // Validate we have minimum required columns
  if (mapping.firstName === undefined || mapping.lastName === undefined) {
    return null
  }

  return mapping as BookedCallsColumnMapping
}

function detectSalesColumns(headers: (string | undefined)[]): SalesColumnMapping | null {
  const mapping: Partial<SalesColumnMapping> = {}

  headers.forEach((header, index) => {
    if (!header) return
    const h = header.toLowerCase().trim().replace(/\n/g, ' ')

    if (h === 'client first name') mapping.firstName = index
    else if (h.includes('client last name')) mapping.lastName = index
    else if (h.includes('client email')) mapping.clientEmail = index
    else if (h === 'phone number') mapping.phone = index
    else if (h === 'date of admissions call') mapping.admissionsCallDate = index
    else if (h.includes('date of purchase') || h.includes('sign-up')) mapping.purchaseDate = index
    else if (h.includes('program selected')) mapping.program = index
    else if (h.includes('purchase price')) mapping.price = index
    else if (h === 'cash collected') mapping.cashCollected = index
    else if (h === 'cad/usd') mapping.currency = index
    else if (h.includes('balance remaining')) mapping.balance = index
    else if (h === 'payment source') mapping.paymentSource = index
    else if (h === 'sales rep') mapping.salesRep = index
    else if (h === 'setter') mapping.setter = index
    else if (h === 'payment status') mapping.paymentStatus = index
  })

  // Validate minimum required columns
  if (mapping.firstName === undefined || mapping.lastName === undefined) {
    return null
  }

  return mapping as SalesColumnMapping
}

function parseBookedCallRow(row: string[], mapping: BookedCallsColumnMapping, yearHint?: number): BookedCallRow | null {
  const firstName = normalizeString(row[mapping.firstName])
  const lastName = normalizeString(row[mapping.lastName])

  // Skip empty rows
  if (!firstName && !lastName) return null

  const clientName = combineNames(firstName, lastName)
  const callDate = parseDate(row[mapping.dateOfCall], yearHint)
  const expectedPackage = normalizeString(row[mapping.packagePurchase])
  const expectedPrice = parsePrice(row[mapping.expectedPrice])
  const closedRaw = normalizeString(row[mapping.closedStatus]).toLowerCase()
  const callStatusRaw = normalizeString(row[mapping.callStatus])
  const reschedules = normalizeString(row[mapping.reschedules])
  const closer = mapping.closer !== undefined ? normalizeString(row[mapping.closer]) : ''
  const currency = mapping.currency !== undefined ? normalizeString(row[mapping.currency]) : 'USD'

  // Map closed status
  let closedStatus: BookedCallRow['closedStatus'] = 'Pending'
  if (closedRaw.includes('yes') || closedRaw === 'closed') {
    closedStatus = 'Closed'
  } else if (closedRaw.includes('no') || closedRaw === 'not closed') {
    closedStatus = 'Not Closed'
  }

  // Map call status
  let callStatus: BookedCallRow['callStatus'] = 'Scheduled'
  const callStatusLower = callStatusRaw.toLowerCase()
  if (callStatusLower.includes('attended') || callStatusLower.includes('yes')) {
    callStatus = 'Attended'
  } else if (callStatusLower.includes('no show') || callStatusLower.includes('no-show')) {
    callStatus = 'No Show'
  } else if (callStatusLower.includes('reschedule')) {
    callStatus = 'Rescheduled'
  } else if (callStatusLower.includes('cancel')) {
    callStatus = 'Cancelled'
  } else if (callStatusLower.includes('booked')) {
    callStatus = 'Scheduled'
  }

  // Parse new fields
  const vibeRaw = mapping.vibe !== undefined ? normalizeString(row[mapping.vibe]) : ''
  const objectionRaw = mapping.objection !== undefined ? normalizeString(row[mapping.objection]) : ''
  const lastContact = mapping.lastContact !== undefined ? parseDate(row[mapping.lastContact], yearHint) : ''
  const lastContactNotes = mapping.lastContactNotes !== undefined ? normalizeString(row[mapping.lastContactNotes]) : ''
  const city = mapping.city !== undefined ? normalizeString(row[mapping.city]) : ''
  const state = mapping.state !== undefined ? normalizeString(row[mapping.state]) : ''

  // Map vibe
  type VibeType = BookedCallRow['vibe']
  let vibe: VibeType = null
  const vibeLower = vibeRaw.toLowerCase()
  if (vibeLower === 'hot') vibe = 'Hot'
  else if (vibeLower === 'warm') vibe = 'Warm'
  else if (vibeLower === 'cold') vibe = 'Cold'
  else if (vibeLower.includes('fence')) vibe = 'On Fence'

  // Map objection
  type ObjectionType = BookedCallRow['objection']
  let objection: ObjectionType = null
  const objectionLower = objectionRaw.toLowerCase()
  if (objectionLower === 'price') objection = 'Price'
  else if (objectionLower === 'timing') objection = 'Timing'
  else if (objectionLower === 'spouse') objection = 'Spouse'
  else if (objectionLower === 'thinking') objection = 'Thinking'
  else if (objectionLower && objectionLower !== '') objection = 'Other'

  return {
    clientName,
    clientEmail: '',
    clientPhone: '',
    bookingDate: callDate,
    callDate,
    callStatus,
    closer,
    expectedPackage,
    expectedPrice,
    closedStatus,
    notes: reschedules ? `Reschedules: ${reschedules}` : '',
    currency,
    setter: '',
    vibe,
    objection,
    lastContact,
    lastContactNotes,
    city,
    state,
  }
}

function parseSalesRow(row: string[], mapping: SalesColumnMapping): SaleSubmissionRow | null {
  const firstName = normalizeString(row[mapping.firstName])
  const lastName = normalizeString(row[mapping.lastName])

  // Skip empty rows
  if (!firstName && !lastName) return null

  const clientName = combineNames(firstName, lastName)
  const clientEmail = normalizeString(row[mapping.clientEmail]).toLowerCase()
  const clientPhone = normalizeString(row[mapping.phone])
  const bookingDate = parseDate(row[mapping.admissionsCallDate])
  const purchaseDate = parseDate(row[mapping.purchaseDate])
  const program = normalizeString(row[mapping.program])
  const price = parsePrice(row[mapping.price])
  const cashCollected = parsePrice(row[mapping.cashCollected])
  const balance = parsePrice(row[mapping.balance])
  const paymentMethod = normalizeString(row[mapping.paymentSource])
  const closer = normalizeString(row[mapping.salesRep])
  const setter = normalizeString(row[mapping.setter])
  const currency = normalizeString(row[mapping.currency]) || 'USD'

  const paymentStatus = mapping.paymentStatus !== undefined ? normalizeString(row[mapping.paymentStatus]) : ''

  return {
    clientEmail,
    clientName,
    clientPhone,
    bookingDate,
    purchaseDate,
    program,
    price,
    cashCollected,
    balance,
    paymentMethod,
    closer,
    setter,
    currency,
    notes: '',
    paymentStatus,
  }
}

function parseBookedCallsSheet(rows: string[][], yearHint?: number): BookedCallRow[] {
  if (rows.length < 2) return []

  // Find header row (might be row 0 or row 1)
  let headerRowIndex = 0
  let mapping = detectBookedCallsColumns(rows[0])

  // Some sheets have header in row 1
  if (!mapping && rows.length > 1) {
    mapping = detectBookedCallsColumns(rows[1])
    if (mapping) headerRowIndex = 1
  }

  if (!mapping) return []

  const results: BookedCallRow[] = []
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const parsed = parseBookedCallRow(row, mapping, yearHint)
    if (parsed) results.push(parsed)
  }

  return results
}

function parseSalesSheet(rows: string[][]): SaleSubmissionRow[] {
  if (rows.length < 2) return []

  const mapping = detectSalesColumns(rows[0])
  if (!mapping) return []

  const results: SaleSubmissionRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const parsed = parseSalesRow(row, mapping)
    if (parsed) results.push(parsed)
  }

  return results
}

// Monthly sheets to read from booked calls (matching excel-reader.ts)
const BOOKED_CALLS_SHEET_NAMES = [
  'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January 26'
]

export async function fetchSheetsData(): Promise<RawSheetsData> {
  const bookedCallsSheetId = process.env.BOOKED_CALLS_SHEET_ID
  const salesSheetId = process.env.SALES_SHEET_ID

  if (!bookedCallsSheetId || !salesSheetId) {
    throw new Error('Missing sheet IDs in environment variables')
  }

  // Get configured ranges or use defaults
  const bookedCallsRange = process.env.BOOKED_CALLS_RANGE
  const salesRange = process.env.SALES_RANGE || "'New Sale Submission Form  (Responses)'!A:Z"

  // Fetch all booked calls from monthly sheets
  const allBookedCalls: BookedCallRow[] = []

  if (bookedCallsRange) {
    // If a specific range is configured, use it
    const rows = await getSheetData(bookedCallsSheetId, bookedCallsRange)
    allBookedCalls.push(...parseBookedCallsSheet(rows, 2025))
  } else {
    // Otherwise, fetch from all monthly sheets
    for (const sheetName of BOOKED_CALLS_SHEET_NAMES) {
      try {
        const rows = await getSheetData(bookedCallsSheetId, `${sheetName}!A:Z`)
        const yearHint = getYearFromTabName(sheetName)
        const calls = parseBookedCallsSheet(rows, yearHint)
        allBookedCalls.push(...calls)
      } catch (error) {
        // Sheet might not exist, skip it
        console.warn(`Could not read sheet "${sheetName}" from booked calls:`, error)
      }
    }
  }

  // Fetch sales data
  const salesRows = await getSheetData(salesSheetId, salesRange)
  const saleSubmissions = parseSalesSheet(salesRows)

  return {
    bookedCalls: allBookedCalls,
    saleSubmissions,
    lastUpdated: new Date().toISOString(),
  }
}

