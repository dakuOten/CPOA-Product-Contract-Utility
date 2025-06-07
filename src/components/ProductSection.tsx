import { useMemo } from 'react'
import type { ZohoProductSubform } from '../types/zoho'
import ProductFilters from './ProductFilters'
import ProductList from './ProductList'

interface ProductSectionProps {
  optimisticProducts: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract'
  updateSearch: (term: string) => void
  updateFilter: (type: 'all' | 'contract') => void
  isUpdating: boolean
  lastUpdatedProduct: string | null
  onProductSelection: (event: React.ChangeEvent<HTMLInputElement>) => void
  formatCurrency: (amount: string | number) => string
  hasContractProduct: boolean
}

export default function ProductSection({
  optimisticProducts,
  searchTerm,
  filterType,
  updateSearch,
  updateFilter,
  isUpdating,
  lastUpdatedProduct,
  onProductSelection,
  formatCurrency,
  hasContractProduct
}: ProductSectionProps) {
  const filteredProducts = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim()
    
    return optimisticProducts.filter(product => {
      try {
        // Enhanced search with safe field access
        const matchesSearch = !lowerSearchTerm || [
          product.Products?.name || '',
          product.Product_Type || '',
          product.Vendor || '',
          (product.Pricing || 0).toString(),
          product.Total_Pricing || '',
          (product.Quantity || 0).toString()
        ].some(field => 
          field.toLowerCase().includes(lowerSearchTerm)
        )

        // Simplified filter - removed 'main' option
        const matchesFilter = filterType === 'all' || 
          (filterType === 'contract' && product.Is_Contract)

        return matchesSearch && matchesFilter
      } catch (error) {
        console.warn('Error filtering product:', error, product)
        return false
      }
    })
  }, [optimisticProducts, searchTerm, filterType])

  return (
    <form 
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className="modern-card">
        {/* Header with Product Count and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Selection
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Select a product to designate as the contract item
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{optimisticProducts.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Products</div>
              </div>
              {hasContractProduct && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-700">Contract Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Filters */}
          <ProductFilters
            searchTerm={searchTerm}
            setSearchTerm={updateSearch}
            filterType={filterType}
            setFilterType={updateFilter}
            productsCount={optimisticProducts.length}
            filteredProductsCount={filteredProducts.length}
            showFilters={optimisticProducts.length > 1}
          />
        </div>

        {/* Professional Product Table */}
        <div className="overflow-x-auto">
          <ProductList
            filteredProducts={filteredProducts}
            allProducts={optimisticProducts}
            searchTerm={searchTerm}
            filterType={filterType}
            setSearchTerm={updateSearch}
            setFilterType={updateFilter}
            isUpdating={isUpdating}
            lastUpdatedProduct={lastUpdatedProduct}
            onProductSelection={onProductSelection}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </form>
  )
}
