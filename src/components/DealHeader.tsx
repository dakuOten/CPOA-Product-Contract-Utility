import { useState } from 'react'
import { reloadWidget, closeWidget } from '../utils/zohoApi'

export default function DealHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleRefresh = async () => {
    console.log('🔄 Refresh Data button clicked')
    setIsRefreshing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      reloadWidget('User clicked Refresh Data button from DealHeader')
    } catch (error) {
      console.error('❌ Failed to refresh widget:', error)
      alert('Failed to refresh data. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClose = async () => {
    console.log('🚪 Close Application button clicked')
    setIsClosing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      closeWidget('User clicked Close Application button from DealHeader')
    } catch (error) {
      console.error('❌ Failed to close widget:', error)
      alert('Failed to close application. Please try again.')    } finally {
      setIsClosing(false)
    }
  }
  return (
    <div className="modern-card">
      {/* Header with Title and Action Buttons */}
      <div className="flex justify-between items-center p-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">PM REQUEST CONTRACT GENERATOR</h1>
          <p className="text-sm text-gray-600 mt-1">Manage contract products for deal records</p>
        </div>
        
        {/* Two Small Buttons Aligned to Right */}
        <div className="flex items-center gap-2">
          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-1 px-2 py-2 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            title="Refresh Data"
          >
            <svg className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Close Application Button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            className={`flex items-center gap-1 px-2 py-2 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            title="Close Application"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {isClosing ? 'Closing...' : 'Close Application'}
          </button>
        </div>
      </div>
    </div>
  )
}
