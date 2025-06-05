import { useEffect, useState } from 'react'
import type { ZohoPageLoadData } from '../types/zoho'

export default function ZohoPageLoad() {
  const [pageData, setPageData] = useState<ZohoPageLoadData | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Wait for ZOHO SDK to be available
    const initZoho = () => {
      if (window.ZOHO?.embeddedApp) {
        // Subscribe to the EmbeddedApp onPageLoad event before initializing
        window.ZOHO.embeddedApp.on("PageLoad", function(data) {
          console.log(`data from pageload : ${JSON.stringify(data)}`)
          setPageData(data)
          // Custom Business logic goes here
        })

        // Initializing the widget
        window.ZOHO.embeddedApp.init()
        setIsInitialized(true)
      } else {
        // Retry if ZOHO is not available yet
        setTimeout(initZoho, 100)
      }
    }

    initZoho()
  }, [])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PM Request Contract - Zoho EmbeddedApp</h1>      <div className="mb-4">
        <span className={`px-2 py-1 rounded text-sm ${
          isInitialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isInitialized ? 'Initialized' : 'Initializing...'}
        </span>
      </div>

      {pageData ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">PageLoad Data Received:</h2>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto">
            {JSON.stringify(pageData, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800">
            Waiting for PageLoad event from Zoho CRM...
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Navigate to a record in Zoho CRM to see the PageLoad data
          </p>
        </div>
      )}
    </div>
  )
}
