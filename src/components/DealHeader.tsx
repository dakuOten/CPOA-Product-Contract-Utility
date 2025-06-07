import { useState } from 'react'
import type { ZohoDealData } from '../types/zoho'

interface DealHeaderProps {
  dealData: ZohoDealData
  productsCount: number
  formatCurrency: (amount: string | number) => string
}

export default function DealHeader({ dealData, productsCount, formatCurrency }: DealHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      {/* Collapsible Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 11-2 0 1 1 0 012 0zm-3 3a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          <h2 className="text-base font-bold text-blue-900">
            {dealData.Deal_Name}
          </h2>
          <span className="text-sm text-blue-600 font-medium">
            ({formatCurrency(dealData.Amount)})
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-blue-200 text-blue-700">
            {productsCount} Product{productsCount !== 1 ? 's' : ''}
          </div>
          <svg 
            className={`w-4 h-4 text-blue-600 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 border-t border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-600 font-medium">Account:</span>
              <span className="text-blue-900 font-semibold truncate">{dealData.Account_Name.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-600 font-medium">Stage:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {dealData.Stage}
              </span>
            </div>
            
            {dealData.Owner && (
              <div className="flex items-center space-x-2 md:col-span-2">
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600 font-medium">Owner:</span>
                <span className="text-gray-900 font-semibold truncate">{dealData.Owner.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
