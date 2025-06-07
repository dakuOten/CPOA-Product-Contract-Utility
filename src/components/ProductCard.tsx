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
}: ProductCardProps) {
  const isSelected = product.Is_Contract
  const isRecentlyUpdated = lastUpdatedProduct === product.Products.id
  return (    <div
      className={`grid grid-cols-12 gap-2 px-2 py-2 transition-all duration-300 cursor-pointer group ${
        isSelected 
          ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-l-4 border-emerald-500 shadow-sm' 
          : 'bg-white hover:bg-blue-50'
      } ${
        isRecentlyUpdated ? 'ring-2 ring-blue-400 ring-opacity-50 animate-pulse' : ''
      } ${
        isUpdating ? 'opacity-75' : ''
      }`}
      onClick={() => {
        if (!isUpdating) {
          const syntheticEvent = {
            target: { value: originalIndex.toString() }
          } as React.ChangeEvent<HTMLInputElement>
          onProductSelection(syntheticEvent)
        }
      }}
    >      {/* Select Column */}
      <div className="col-span-1 flex items-center justify-center p-1">
        <div className="relative">
          <input
            type="radio"
            name="selectedProduct"
            value={originalIndex}
            checked={isSelected}
            onChange={onProductSelection}
            disabled={isUpdating}
            className={`w-5 h-5 text-emerald-600 border-2 border-gray-300 focus:ring-emerald-500 focus:ring-2 ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              isSelected ? 'border-emerald-500' : 'border-gray-300'
            }`}
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>      {/* Product Name Column */}
      <div className="col-span-3 min-w-0 p-1">
        <div className="flex flex-col space-y-1">
          <div 
            className="font-medium text-gray-900 text-sm leading-tight truncate group-hover:text-blue-900 transition-colors" 
            title={product.Products.name}
          >
            {product.Products.name}
          </div>
          
          {/* Compact Status Section */}
          <div className="flex flex-wrap gap-1 items-center">
            {isSelected ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                ✓ Contract
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                Available
              </span>
            )}
            
            {product.Main_Product && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                ★ Main
              </span>
            )}
            
            {isRecentlyUpdated && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 animate-pulse">
                ⟳ Updated
              </span>
            )}
            
            {isUpdating && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-600">
                ⟳ Updating...
              </span>
            )}
          </div>
        </div>
      </div>      {/* Type & Details Column */}
      <div className="col-span-2 space-y-1 p-1">
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {product.Product_Type}
          </span>
        </div>
        <div className="space-y-0.5 text-xs">
          {product.Vendor && (
            <div className="flex items-center text-gray-600">
              <span className="truncate font-medium">{product.Vendor}</span>
            </div>
          )}
          {product.Product_Grouping && (
            <div className="flex items-center text-gray-600">
              <span className="truncate font-medium">{product.Product_Grouping}</span>
            </div>
          )}        </div>
      </div>

      {/* Quantity Column */}
      <div className="col-span-1 flex items-center justify-center p-1">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900">{product.Quantity}</div>
          <div className="text-xs text-gray-500">units</div>
        </div>
      </div>      {/* Terms Column */}
      <div className="col-span-1 flex items-center justify-center p-1">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">{product.Terms}</div>
          <div className="text-xs text-gray-500">months</div>
        </div>      </div>

      {/* Unit Price Column */}
      <div className="col-span-2 flex items-center justify-end p-1">
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{formatCurrency(product.Pricing)}</div>
          <div className="text-xs text-gray-500">per unit</div>
        </div>
      </div>      {/* Total Price Column */}
      <div className="col-span-2 flex items-center justify-end p-1">
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-600">{formatCurrency(product.Total_Pricing)}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>
      </div>
    </div>
  )
}
