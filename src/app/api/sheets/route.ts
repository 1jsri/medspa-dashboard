import { NextResponse } from 'next/server'
import { readExcelData, getDemoData } from '@/lib/excel-reader'
import { fetchSheetsData, hasGoogleCredentials } from '@/lib/google-sheets'
import { transformData } from '@/lib/data-transformer'

export const revalidate = 60 // Cache for 60 seconds
export const dynamic = 'force-dynamic' // Ensure fresh data on each request

export async function GET(request: Request) {
  // Check if demo mode is explicitly requested via query param
  const { searchParams } = new URL(request.url)
  const forceDemo = searchParams.get('demo') === 'true'

  try {
    let rawData
    let dataSource = 'demo'
    let errorDetails: string[] = []

    if (forceDemo) {
      // Explicitly requested demo mode
      rawData = getDemoData()
      dataSource = 'demo'
      console.log('Using demo data (explicitly requested)')
    } else {
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

      // Priority 3: Fall back to demo data ONLY if both real data sources failed
      if (!rawData) {
        console.warn('⚠ All data sources failed, falling back to demo data')
        rawData = getDemoData()
        dataSource = 'demo'
      }
    }

    const dashboardData = transformData(rawData)

    return NextResponse.json({
      ...dashboardData,
      _meta: {
        dataSource,
        lastFetched: new Date().toISOString(),
        ...(dataSource === 'demo' && errorDetails.length > 0 && {
          errors: errorDetails,
          warning: 'Showing demo data because real data sources failed. Check your configuration.'
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
