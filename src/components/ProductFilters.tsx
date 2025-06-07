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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                // Prevent form submission on Enter key
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              placeholder="Search by name, type, vendor..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                title="Clear search"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter Products
          </label>          <select
            id="filter"
            value={filterType}
            onChange={handleFilterChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Products ({productsCount})</option>
            <option value="contract">Contract Items Only</option>
          </select>
        </div>
      </div>      {/* Results Summary */}
      {(searchTerm || filterType !== 'all') && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <span className="font-medium">
                {filteredProductsCount === 0 ? 'No products found' : 
                 `Showing ${filteredProductsCount} of ${productsCount} products`}
              </span>
              {searchTerm && (
                <div className="mt-1">
                  <span className="text-blue-600">Search: "</span>
                  <span className="font-medium text-blue-800">{searchTerm}</span>
                  <span className="text-blue-600">"</span>
                </div>
              )}
              {filterType !== 'all' && (
                <div className="mt-1">
                  <span className="text-blue-600">Filter: </span>
                  <span className="font-medium text-blue-800">
                    {filterType === 'contract' ? 'Contract Items Only' : filterType}
                  </span>
                </div>
              )}
            </div>            {(searchTerm || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  clearSearch()
                  setFilterType('all')
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
