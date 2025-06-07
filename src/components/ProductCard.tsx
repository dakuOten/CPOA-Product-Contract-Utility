import React from 'react'
import type { ZohoProductSubform } from '../types/zoho'

interface ProductCardProps {
  product: ZohoProductSubform
  originalIndex: number
  isUpdating: boolean
  lastUpdatedProduct: string | null
  onProductSelection: (event: React.ChangeEvent<HTMLInputElement>) => void
  formatCurrency: (amount: string | number) => string
}

export default function ProductCard({
  product,
  originalIndex,
  isUpdating,
  lastUpdatedProduct,
  onProductSelection,
  formatCurrency
}: ProductCardProps) {  return (
    <div
      className={`p-2 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
        product.Is_Contract 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-2 border-green-400' 
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between space-x-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start space-x-3">            <input
              type="radio"
              name="selectedProduct"
              value={originalIndex}
              checked={product.Is_Contract}
              onChange={onProductSelection}
              disabled={isUpdating}
              className={`w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500 ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">                  <h4 className="font-semibold text-gray-900 break-words text-sm">
                    {product.Products.name}
                  </h4>
                  <div className="flex items-center space-x-1 mt-1">                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {product.Product_Type}
                    </span>                    {product.Vendor && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        {product.Vendor}
                      </span>
                    )}
                    {product.Product_Grouping && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        {product.Product_Grouping}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
            <div className="mt-1 space-y-1">
            {/* Primary product details */}
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</span>
                  <span className="text-xs font-semibold text-gray-900">{product.Quantity}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terms</span>
                  <span className="text-xs font-semibold text-gray-900">{product.Terms}</span>
                </div>
              </div>
            </div>
            
            {/* Pricing details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <div className="bg-blue-50 rounded p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Unit</span>
                  <span className="text-xs font-bold text-blue-900">{formatCurrency(product.Pricing)}</span>
                </div>
              </div>
              <div className="bg-green-50 rounded p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Total</span>
                  <span className="text-xs font-bold text-green-900">{formatCurrency(product.Total_Pricing)}</span>
                </div>              </div>
            </div>
          </div>
        </div>
          <div className="flex-shrink-0">
          {product.Is_Contract && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
              Contract Item
            </span>
          )}
          {lastUpdatedProduct === product.Products.id && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2 whitespace-nowrap">
              Just Updated
            </span>
          )}
          {product.Main_Product && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2 whitespace-nowrap">
              Main Product
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
