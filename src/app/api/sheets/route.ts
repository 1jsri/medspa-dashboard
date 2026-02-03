import { NextResponse } from 'next/server'
import { readExcelData } from '@/lib/excel-reader'
import { fetchSheetsData, hasGoogleCredentials } from '@/lib/google-sheets'
import { transformData } from '@/lib/data-transformer'
import type { RawSheetsData } from '@/types/sheets'

export const revalidate = 60 // Cache for 60 seconds
export const dynamic = 'force-dynamic' // Ensure fresh data on each request

export async function GET() {
  try {
    let rawData: RawSheetsData | null = null
    let dataSource = 'none'
    const errorDetails: string[] = []

    // Priority 1: Try Google Sheets if credentials are configured
    if (hasGoogleCredentials()) {
      try {
        console.log('Attempting to fetch from Google Sheets...')
        rawData = await fetchSheetsData()
        dataSource = 'google-sheets'
        console.log(`✓ Loaded ${rawData.bookedCalls.length} booked calls and ${rawData.saleSubmissions.length} sales from Google Sheets`)
      } catch (googleError) {
        const errorMsg = googleError instanceof Error ? googleError.message : String(googleError)
        console.error('✗ Google Sheets error:', errorMsg)
        errorDetails.push(`Google Sheets: ${errorMsg}`)
        rawData = null
      }
    } else {
      console.log('Google Sheets credentials not configured')
      errorDetails.push('Google Sheets: credentials not configured')
    }

    // Priority 2: Fall back to local Excel files
    if (!rawData) {
      try {
        console.log('Attempting to read local Excel files...')
        rawData = readExcelData()
        dataSource = 'excel'
        console.log(`✓ Loaded ${rawData.bookedCalls.length} booked calls and ${rawData.saleSubmissions.length} sales from Excel`)
      } catch (fileError) {
        const errorMsg = fileError instanceof Error ? fileError.message : String(fileError)
        console.error('✗ Excel file error:', errorMsg)
        errorDetails.push(`Excel: ${errorMsg}`)
        rawData = null
      }
    }

    // No demo data fallback - return empty data with error info if both sources failed
    if (!rawData) {
      console.error('✗ All data sources failed - returning empty data')
      rawData = {
        bookedCalls: [],
        saleSubmissions: [],
        lastUpdated: new Date().toISOString(),
      }
      dataSource = 'none'
    }

    // Debug logging to help diagnose data issues
    console.log('[API] Booked calls fetched:', rawData.bookedCalls.length)
    console.log('[API] Sales submissions fetched:', rawData.saleSubmissions.length)
    if (rawData.bookedCalls.length > 0) {
      console.log('[API] Sample booking dates:', rawData.bookedCalls.slice(0, 3).map(c => c.bookingDate))
    }

    const dashboardData = transformData(rawData)

    return NextResponse.json({
      ...dashboardData,
      _meta: {
        dataSource,
        lastFetched: new Date().toISOString(),
        ...(dataSource === 'none' && errorDetails.length > 0 && {
          errors: errorDetails,
          warning: 'No data loaded - all data sources failed. Check your configuration.'
        }),
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Critical error processing data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Return error response instead of silently falling back to demo
    return NextResponse.json({
      error: 'Failed to load dashboard data',
      details: errorMessage,
      _meta: {
        dataSource: 'error',
        lastFetched: new Date().toISOString(),
      }
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
}
