import React from 'react'
import type { ZohoProductSubform } from '../types/zoho'
import ProductCard from './ProductCard'

interface ProductListProps {
  filteredProducts: ZohoProductSubform[]
  allProducts: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract' | 'main'
  setSearchTerm: (term: string) => void
  setFilterType: (type: 'all' | 'contract' | 'main') => void
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
        </p>
        {(searchTerm || filterType !== 'all') && (
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
    <div className="divide-y divide-gray-200">
      {filteredProducts.map((product) => {
        // Find the original index in the full products array
        const originalIndex = allProducts.findIndex(p => p.Products.id === product.Products.id)
        return (
          <ProductCard
            key={`${product.Products.id}-${originalIndex}`}
            product={product}
            originalIndex={originalIndex}
            isUpdating={isUpdating}
            lastUpdatedProduct={lastUpdatedProduct}
            onProductSelection={onProductSelection}
            formatCurrency={formatCurrency}
          />
        )
      })}
    </div>
  )
}
