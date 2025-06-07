import './index.css'
import { useState, useCallback } from 'react'
import type { ZohoPageLoadData } from './types/zoho'
import ContractProduct from './components/ContractProduct'
import Toast from './components/Toast'

interface AppProps {
  data: ZohoPageLoadData
}

// Toast context type
interface ToastState {
  isVisible: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

const App = ({ data }: AppProps) => {
  const [showRawData, setShowRawData] = useState(false)
  
  // Toast state management at App level
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: 'info'
  })

  // Toast utility functions
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Contract Product Management */}
        <ContractProduct 
          dealData={data.data}
          showToast={showToast}
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
      
      {/* Toast Notification - Rendered at App level */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default App