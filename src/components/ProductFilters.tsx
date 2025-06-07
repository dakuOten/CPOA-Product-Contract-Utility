interface ProductFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterType: 'all' | 'contract' | 'main'
  setFilterType: (type: 'all' | 'contract' | 'main') => void
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
  if (!showFilters) return null

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, type, or vendor..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter Products
          </label>
          <select
            id="filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'contract' | 'main')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Products</option>
            <option value="contract">Contract Items Only</option>
            <option value="main">Main Products Only</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || filterType !== 'all') && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProductsCount} of {productsCount} products
          {searchTerm && (
            <span className="ml-2">
              • Search: "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </div>
      )}
    </>
  )
}
