import { useCallback } from 'react'

interface ProductFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterType: 'all' | 'contract'
  setFilterType: (type: 'all' | 'contract') => void
  productsCount: number
  filteredProductsCount: number
  showFilters: boolean
}

export default function ProductFilters({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  productsCount,
  filteredProductsCount,
  showFilters
}: ProductFiltersProps) {
  // Direct search handling - no debouncing to prevent blackouts
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value
      setSearchTerm(value)
    } catch (error) {
      console.error('Search change error:', error)
    }
  }, [setSearchTerm])

  // Clear search function
  const clearSearch = useCallback(() => {
    try {
      setSearchTerm('')
    } catch (error) {
      console.error('Clear search error:', error)
    }
  }, [setSearchTerm])

  // Handle filter change
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const value = e.target.value as 'all' | 'contract'
      setFilterType(value)
    } catch (error) {
      console.error('Filter change error:', error)
    }
  }, [setFilterType])

  if (!showFilters) return null
  return (
    <>
      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              placeholder="Search by name, type, vendor..."
              className="block w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Clear search"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter
          </label>
          <select
            id="filter"
            value={filterType}
            onChange={handleFilterChange}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
          >
            <option value="all">All Products ({productsCount})</option>
            <option value="contract">Contract Items Only</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || filterType !== 'all') && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-blue-800">
                  {filteredProductsCount === 0 ? 'No products found' : 
                   `Showing ${filteredProductsCount} of ${productsCount} products`}
                </span>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Filter: {filterType === 'contract' ? 'Contract Items Only' : filterType}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                clearSearch()
                setFilterType('all')
              }}
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Clear All
            </button>
          </div>
        </div>
      )}
    </>
  )
}
