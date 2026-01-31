import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import type { BookedCallRow, SaleSubmissionRow, RawSheetsData } from '@/types/sheets'

const EXCEL_DATA_PATH = process.env.EXCEL_DATA_PATH || '/Users/jj/Documents/MedSpa'
const BOOKED_CALLS_FILE = 'Copy of Booked Calls - IIAM Michael x Hannah.xlsx'
const SALES_FILE = 'Copy of New Sale Submission Form  (Responses).xlsx'

// Sheets to read from booked calls file (monthly sheets with call data)
const BOOKED_CALLS_SHEETS = [
  'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January 26'
]

// Sheet name for sales submission form responses
const SALES_SHEET_NAME = 'New Sale Submission Form  (Resp'

function excelDateToISO(excelDate: number | string | undefined): string {
  if (!excelDate) return ''

  // If it's already a string (like "June 30th"), try to parse it
  if (typeof excelDate === 'string') {
    // Handle dates like "June 30th"
    const cleaned = excelDate.replace(/(\d+)(st|nd|rd|th)/i, '$1').trim()
    const currentYear = new Date().getFullYear()
    const parsed = new Date(cleaned + ', ' + currentYear)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    return ''
  }

  // Excel date serial number conversion
  // Excel dates are days since December 30, 1899
  const date = new Date((excelDate - 25569) * 86400 * 1000)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function parsePrice(value: string | number | undefined): number {
  if (!value) return 0
  if (typeof value === 'number') return value
  // Remove currency symbols, commas, and spaces
  const cleaned = String(value).replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function normalizeString(value: string | undefined | null): string {
  if (!value) return ''
  return String(value).trim()
}

function combineNames(firstName: string | undefined, lastName: string | undefined): string {
  const first = normalizeString(firstName)
  const last = normalizeString(lastName)
  return [first, last].filter(Boolean).join(' ')
}

// Normalize name for matching (lowercase, remove extra spaces)
export function normalizeNameForMatching(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

interface ColumnMapping {
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

function detectBookedCallsColumns(headers: (string | undefined)[]): ColumnMapping | null {
  const mapping: Partial<ColumnMapping> = {}

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

  return mapping as ColumnMapping
}

function parseBookedCallsRow(row: (string | number | undefined)[], mapping: ColumnMapping): BookedCallRow | null {
  const firstName = normalizeString(row[mapping.firstName] as string)
  const lastName = normalizeString(row[mapping.lastName] as string)

  // Skip empty rows
  if (!firstName && !lastName) return null

  const clientName = combineNames(firstName, lastName)
  const callDate = excelDateToISO(row[mapping.dateOfCall])
  const expectedPackage = normalizeString(row[mapping.packagePurchase] as string)
  const expectedPrice = parsePrice(row[mapping.expectedPrice])
  const closedRaw = normalizeString(row[mapping.closedStatus] as string).toLowerCase()
  const callStatusRaw = normalizeString(row[mapping.callStatus] as string)
  const reschedules = normalizeString(row[mapping.reschedules] as string)
  const closer = mapping.closer !== undefined ? normalizeString(row[mapping.closer] as string) : ''
  const currency = mapping.currency !== undefined ? normalizeString(row[mapping.currency] as string) : 'USD'

  // Map closed status
  let closedStatus: BookedCallRow['closedStatus'] = 'Pending'
  if (closedRaw.includes('yes') || closedRaw === 'closed') {
    closedStatus = 'Closed'
  } else if (closedRaw.includes('no') || closedRaw === 'not closed') {
    closedStatus = 'Not Closed'
  }

  // Map call status - normalize various formats
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
  const vibeRaw = mapping.vibe !== undefined ? normalizeString(row[mapping.vibe] as string) : ''
  const objectionRaw = mapping.objection !== undefined ? normalizeString(row[mapping.objection] as string) : ''
  const lastContact = mapping.lastContact !== undefined ? excelDateToISO(row[mapping.lastContact]) : ''
  const lastContactNotes = mapping.lastContactNotes !== undefined ? normalizeString(row[mapping.lastContactNotes] as string) : ''
  const city = mapping.city !== undefined ? normalizeString(row[mapping.city] as string) : ''
  const state = mapping.state !== undefined ? normalizeString(row[mapping.state] as string) : ''

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
    clientEmail: '', // No email in booked calls
    clientPhone: '',
    bookingDate: callDate, // Using call date as booking date
    callDate,
    callStatus,
    closer,
    expectedPackage,
    expectedPrice,
    closedStatus,
    notes: reschedules ? `Reschedules: ${reschedules}` : '',
    currency,
    setter: '', // No setter in booked calls
    vibe,
    objection,
    lastContact,
    lastContactNotes,
    city,
    state,
  }
}

function parseBookedCallsSheet(sheet: XLSX.WorkSheet): BookedCallRow[] {
  const data = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 })
  if (data.length < 2) return []

  // Find header row (might be row 0 or row 1 depending on sheet)
  let headerRowIndex = 0
  let mapping = detectBookedCallsColumns(data[0] as (string | undefined)[])

  // Some sheets have header in row 1
  if (!mapping && data.length > 1) {
    mapping = detectBookedCallsColumns(data[1] as (string | undefined)[])
    if (mapping) headerRowIndex = 1
  }

  if (!mapping) return []

  const results: BookedCallRow[] = []
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const parsed = parseBookedCallsRow(row, mapping)
    if (parsed) results.push(parsed)
  }

  return results
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

function parseSalesRow(row: (string | number | undefined)[], mapping: SalesColumnMapping): SaleSubmissionRow | null {
  const firstName = normalizeString(row[mapping.firstName] as string)
  const lastName = normalizeString(row[mapping.lastName] as string)

  // Skip empty rows
  if (!firstName && !lastName) return null

  const clientName = combineNames(firstName, lastName)
  const clientEmail = normalizeString(row[mapping.clientEmail] as string).toLowerCase()
  const clientPhone = normalizeString(row[mapping.phone] as string)
  const bookingDate = excelDateToISO(row[mapping.admissionsCallDate])
  const purchaseDate = excelDateToISO(row[mapping.purchaseDate])
  const program = normalizeString(row[mapping.program] as string)
  const price = parsePrice(row[mapping.price])
  const cashCollected = parsePrice(row[mapping.cashCollected])
  const balance = parsePrice(row[mapping.balance])
  const paymentMethod = normalizeString(row[mapping.paymentSource] as string)
  const closer = normalizeString(row[mapping.salesRep] as string)
  const setter = normalizeString(row[mapping.setter] as string)
  const currency = normalizeString(row[mapping.currency] as string) || 'USD'

  const paymentStatus = mapping.paymentStatus !== undefined ? normalizeString(row[mapping.paymentStatus] as string) : ''

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

function parseSalesSheet(sheet: XLSX.WorkSheet): SaleSubmissionRow[] {
  const data = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 })
  if (data.length < 2) return []

  const mapping = detectSalesColumns(data[0] as (string | undefined)[])
  if (!mapping) return []

  const results: SaleSubmissionRow[] = []
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const parsed = parseSalesRow(row, mapping)
    if (parsed) results.push(parsed)
  }

  return results
}

export function readExcelData(): RawSheetsData {
  const bookedCallsPath = path.resolve(EXCEL_DATA_PATH, BOOKED_CALLS_FILE)
  const salesPath = path.resolve(EXCEL_DATA_PATH, SALES_FILE)

  // Check if files exist
  if (!fs.existsSync(bookedCallsPath)) {
    throw new Error(`Booked calls file not found: ${bookedCallsPath}`)
  }
  if (!fs.existsSync(salesPath)) {
    throw new Error(`Sales file not found: ${salesPath}`)
  }

  // Read files into buffer first to avoid path issues
  const bookedCallsBuffer = fs.readFileSync(bookedCallsPath)
  const salesBuffer = fs.readFileSync(salesPath)

  // Read booked calls from all monthly sheets
  const bookedWb = XLSX.read(bookedCallsBuffer, { type: 'buffer' })
  const allBookedCalls: BookedCallRow[] = []

  for (const sheetName of BOOKED_CALLS_SHEETS) {
    const sheet = bookedWb.Sheets[sheetName]
    if (sheet) {
      const calls = parseBookedCallsSheet(sheet)
      allBookedCalls.push(...calls)
    }
  }

  // Read sales submissions
  const salesWb = XLSX.read(salesBuffer, { type: 'buffer' })
  const salesSheet = salesWb.Sheets[SALES_SHEET_NAME]
  const saleSubmissions = salesSheet ? parseSalesSheet(salesSheet) : []

  return {
    bookedCalls: allBookedCalls,
    saleSubmissions,
    lastUpdated: new Date().toISOString(),
  }
}

export function getDemoData(): RawSheetsData {
  const bookedCalls: BookedCallRow[] = [
    { clientName: 'Sarah Johnson', clientEmail: 'sarah.j@email.com', clientPhone: '555-0101', bookingDate: '2024-01-05', callDate: '2024-01-08', callStatus: 'Attended', closer: 'Hannah', expectedPackage: 'Premium Facial Package', expectedPrice: 2500, closedStatus: 'Closed', notes: '', currency: 'USD', setter: 'Michael', vibe: 'Hot', objection: null, lastContact: '2024-01-08', lastContactNotes: 'Great call, very interested', city: 'Toronto', state: 'Ontario' },
    { clientName: 'Emily Chen', clientEmail: 'emily.chen@email.com', clientPhone: '555-0102', bookingDate: '2024-01-06', callDate: '2024-01-10', callStatus: 'Attended', closer: 'Michael', expectedPackage: 'Body Contouring', expectedPrice: 4000, closedStatus: 'Closed', notes: '', currency: 'USD', setter: 'Hannah', vibe: 'Warm', objection: null, lastContact: '2024-01-10', lastContactNotes: 'Discussed financing options', city: 'Vancouver', state: 'British Columbia' },
  ]

  const saleSubmissions: SaleSubmissionRow[] = [
    { clientEmail: 'sarah.j@email.com', clientName: 'Sarah Johnson', clientPhone: '555-0101', bookingDate: '2024-01-05', purchaseDate: '2024-01-08', program: 'Premium Facial Package', price: 2500, cashCollected: 2500, balance: 0, paymentMethod: 'Credit Card', notes: '', closer: 'Hannah', setter: 'Michael', currency: 'USD', paymentStatus: '' },
  ]

  return {
    bookedCalls,
    saleSubmissions,
    lastUpdated: new Date().toISOString(),
  }
}
