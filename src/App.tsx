
import './index.css'
import { useState } from 'react'
import { IoClose, IoRefresh } from 'react-icons/io5'
import type { ZohoPageLoadData } from './types/zoho'
import ContractProduct from './components/ContractProduct'
import { updateContractProductAndClose, reloadWidget } from './utils/zohoApi'

interface AppProps {
  data: ZohoPageLoadData
}

const App = ({ data }: AppProps) => {
  const [showRawData, setShowRawData] = useState(false)

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                PM Request Contract
              </h1>
              <p className="text-gray-600">
                Manage contract products for deal records
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {/* Reload Widget Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      Refresh Data
                    </h3>
                    <p className="text-xs text-blue-700">
                      Reload to get latest data from Zoho CRM
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => reloadWidget('User clicked Refresh Data button from header')}
                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-colors flex-shrink-0"
                    title="Refresh Data"
                  >
                    <IoRefresh size={18} />
                  </button>
                </div>
              </div>
              
              {/* Close Application Card */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-900 mb-1">
                      Close Application
                    </h3>
                    <p className="text-xs text-red-700">
                      Closes the widget and updates the Contract_Product field
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateContractProductAndClose(data.data.id, false, 'User clicked Close Application button from header')}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 transition-colors flex-shrink-0"
                    title="Close Application"
                  >
                    <IoClose size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ✓ Connected to Zoho CRM
          </span>
        </div>

        {/* Contract Product Management */}
        <ContractProduct 
          dealData={data.data} 
        />

        {/* Debug Section */}
        <div className="mt-8 border-t pt-6">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showRawData ? 'rotate-90' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>{showRawData ? 'Hide' : 'Show'} Raw Data</span>
          </button>
          
          {showRawData && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-2 text-gray-800">
                PageLoad Data
              </h3>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto text-gray-700 max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App