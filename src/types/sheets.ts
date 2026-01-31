// Raw data types from Excel files

export type VibeType = 'Hot' | 'Warm' | 'Cold' | 'On Fence' | null
export type ObjectionType = 'Price' | 'Timing' | 'Spouse' | 'Thinking' | 'Other' | null

export interface BookedCallRow {
  clientName: string
  clientEmail: string
  clientPhone: string
  bookingDate: string
  callDate: string
  callStatus: 'Scheduled' | 'Attended' | 'No Show' | 'Rescheduled' | 'Cancelled'
  closer: string
  expectedPackage: string
  expectedPrice: number
  closedStatus: 'Closed' | 'Not Closed' | 'Pending'
  notes: string
  currency: string
  setter: string
  vibe: VibeType
  objection: ObjectionType
  lastContact: string
  lastContactNotes: string
  city: string
  state: string
}

export interface SaleSubmissionRow {
  clientEmail: string
  clientName: string
  clientPhone: string
  bookingDate: string
  purchaseDate: string
  program: string
  price: number
  cashCollected: number
  balance: number
  paymentMethod: string
  notes: string
  closer: string
  setter: string
  currency: string
  paymentStatus: string
}

export interface RawSheetsData {
  bookedCalls: BookedCallRow[]
  saleSubmissions: SaleSubmissionRow[]
  lastUpdated: string
}
