import React, { useEffect, useRef } from 'react'
import type { ZohoProductSubform } from '../types/zoho'
import ProductCard from './ProductCard'

interface ProductListProps {
  filteredProducts: ZohoProductSubform[]
  allProducts: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract'
  setSearchTerm: (term: string) => void
  setFilterType: (type: 'all' | 'contract') => void
  isUpdating: boolean
  lastUpdatedProduct: string | null
  onProductSelection: (event: React.ChangeEvent<HTMLInputElement>) => void
  formatCurrency: (amount: string | number) => string
}

export default function ProductList({
  filteredProducts,
  allProducts,
  searchTerm,
  filterType,
  setSearchTerm,
  setFilterType,
  isUpdating,
  lastUpdatedProduct,
  onProductSelection,
  formatCurrency
}: ProductListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const endOfListRef = useRef<HTMLDivElement>(null)
  // Auto-scroll to selected or updated item
  useEffect(() => {
    if (selectedItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedElement = selectedItemRef.current
      
      // Add a small delay to ensure the DOM has been updated
      const timeoutId = setTimeout(() => {
        const containerRect = container.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()
        
        const isVisible = (
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom
        )
        
        if (!isVisible) {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [filteredProducts, lastUpdatedProduct])

  if (filteredProducts.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600">
          {searchTerm || filterType !== 'all' 
            ? 'Try adjusting your search or filter criteria.' 
            : 'No products are available in this deal.'}
        </p>        {(searchTerm || filterType !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setFilterType('all')
            }}
            className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">      {/* Professional Table Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200">
        <div className="grid grid-cols-12 gap-2 px-2 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <div className="col-span-1 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="col-span-3 flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <span>Product Name</span>
          </div>
          <div className="col-span-2 flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Type & Details</span>
          </div>
          <div className="col-span-1 text-center">
            <div className="flex flex-col items-center">
              <svg className="w-4 h-4 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span>Qty</span>
            </div>
          </div>
          <div className="col-span-1 text-center">
            <div className="flex flex-col items-center">
              <svg className="w-4 h-4 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Terms</span>
            </div>
          </div>
          <div className="col-span-2 text-right">
            <div className="flex flex-col items-end">
              <svg className="w-4 h-4 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Unit Price</span>
            </div>
          </div>
          <div className="col-span-2 text-right">
            <div className="flex flex-col items-end">
              <svg className="w-4 h-4 text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Table Body with Auto-Scroll */}
      <div 
        className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
        style={{
          scrollBehavior: 'smooth'
        }}
        ref={scrollContainerRef}
      >
        <div className="divide-y divide-gray-100">
          {filteredProducts.map((product, index) => {
            // Find the original index in the full products array
            const originalIndex = allProducts.findIndex(p => p.Products.id === product.Products.id)
            const isSelected = product.Is_Contract
            const isRecentlyUpdated = lastUpdatedProduct === product.Products.id
            
            return (
              <div
                key={`${product.Products.id}-${originalIndex}`}
                className={`transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 hover:shadow-sm`}
                ref={
                  (isSelected || isRecentlyUpdated) ? selectedItemRef : null
                }
              >
                <ProductCard
                  product={product}
                  originalIndex={originalIndex}
                  isUpdating={isUpdating}
                  lastUpdatedProduct={lastUpdatedProduct}
                  onProductSelection={onProductSelection}
                  formatCurrency={formatCurrency}
                />
              </div>
            )
          })}
        </div>
          {/* End of list indicator */}
        <div className="px-2 py-3 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
          {filteredProducts.length === 1 
            ? '1 product shown' 
            : `${filteredProducts.length} products shown`}
        </div>
      </div>

      {/* Reference div for scrolling */}
      <div ref={endOfListRef} className="h-0" />
    </div>
  )
}
