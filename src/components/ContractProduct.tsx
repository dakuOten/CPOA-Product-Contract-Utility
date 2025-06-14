import { 
  useActionState, 
  useOptimistic, 
  useMemo, 
  useState,
  useEffect,
  startTransition,
  useCallback,
  useTransition
} from 'react'
import type { ZohoDealData, ZohoProductSubform } from '../types/zoho'
import { ContractProvider } from '../contexts/ContractProvider'
import {
  productSelectionAction, 
  clearContractsAction, 
  generatePMRequestAction,
  type ContractActionState 
} from '../hooks/contractActions'
import { useContractCleanup } from '../hooks/contractHooks'
import DealHeader from './DealHeader'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import ProductFilters from './ProductFilters'
import ProductList from './ProductList'
import ActionButtons from './ActionButtons'

interface ContractProductProps {
  dealData: ZohoDealData
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function ContractProduct({ dealData, showToast }: ContractProductProps) {
  // Initialize action state with React 19's useActionState
  const initialState: ContractActionState = {
    products: dealData.Subform_1 || [],
    lastUpdatedProduct: null,
    error: null,
    success: null,
    isAutoSelectionApplied: false
  }
  // Use React 19's useActionState for managing form actions
  const [state, productAction, isPending] = useActionState(productSelectionAction, initialState)
  const [clearState, clearAction] = useActionState(clearContractsAction, initialState)
  const [pmState, pmAction] = useActionState(generatePMRequestAction, initialState)

  // Add dedicated useTransition for PM Request generation with React 19 patterns
  const [isPMRequestPending, startPMRequestTransition] = useTransition()

  // Use React 19's useOptimistic for optimistic UI updates
  const [optimisticProducts, addOptimisticUpdate] = useOptimistic(
    state.products,
    (currentProducts: ZohoProductSubform[], optimisticValue: { productIndex: number; isContract: boolean }) => {
      return currentProducts.map((product, index) => ({
        ...product,
        Is_Contract: index === optimisticValue.productIndex ? optimisticValue.isContract : false
      }))
    }
  )  // Local state for search and filter - using useState instead of refs for proper reactivity
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterType, setFilterType] = useState<'all' | 'contract'>('all')
  // Use cleanup hook
  useContractCleanup(optimisticProducts, dealData.id)

  // Auto-selection logic using React 19 patterns - moved to useEffect to prevent infinite renders
  useEffect(() => {
    const shouldAutoSelect = optimisticProducts.length === 1 && 
      !optimisticProducts[0].Is_Contract && 
      !isPending &&
      !state.isAutoSelectionApplied

    if (shouldAutoSelect) {
      startTransition(() => {
        const formData = new FormData()
        formData.append('dealId', dealData.id)
        formData.append('productIndex', '0')
        formData.append('products', JSON.stringify(optimisticProducts))
        
        // Add optimistic update
        addOptimisticUpdate({ productIndex: 0, isContract: true })
        
        // Execute the action
        productAction(formData)
      })
    }
  }, [optimisticProducts, isPending, state.isAutoSelectionApplied, dealData.id, addOptimisticUpdate, productAction])  // Memoized values
  const hasContractProduct = useMemo(() => {
    return optimisticProducts.some(product => product.Is_Contract)
  }, [optimisticProducts])

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

  // Product selection handler using React 19 patterns
  const handleProductSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    const productIndex = parseInt(event.target.value)
    const isChecked = event.target.checked

    if (isChecked) {
      startTransition(() => {
        // Add optimistic update first
        addOptimisticUpdate({ productIndex, isContract: true })
        
        // Prepare form data
        const formData = new FormData()
        formData.append('dealId', dealData.id)
        formData.append('productIndex', productIndex.toString())
        formData.append('products', JSON.stringify(optimisticProducts))
        
        // Execute the action
        productAction(formData)
      })
    }
  }, [dealData.id, optimisticProducts, productAction, addOptimisticUpdate])

  // Handle clear action
  const handleCloseAndClear = useCallback(() => {
    startTransition(() => {
      const formData = new FormData()
      formData.append('dealId', dealData.id)
      formData.append('products', JSON.stringify(optimisticProducts))
      
      clearAction(formData)
    })
  }, [dealData.id, optimisticProducts, clearAction])
  // Handle PM Request generation with React 19 useTransition patterns
  const handleGeneratePMRequest = useCallback(() => {
    const contractProduct = optimisticProducts.find(product => product.Is_Contract)
    if (!contractProduct) {
      showToast('No contract product selected. Please select a product first.', 'error')
      return
    }

    // Use React 19's useTransition for non-blocking UI updates
    startPMRequestTransition(async () => {
      try {
        // Show immediate optimistic feedback
        showToast(
          `Creating PM Request for "${contractProduct.Products.name}"...`,
          'info'
        )
        
        // Prepare form data and execute the PM request action
        const formData = new FormData()
        formData.append('dealId', dealData.id)
        formData.append('products', JSON.stringify(optimisticProducts))
        
        // Execute the action within the transition
        await pmAction(formData)
        
      } catch (error) {
        // Handle any errors during the transition
        console.error('PM Request generation error:', error)
        showToast('Failed to create PM Request', 'error')
      }
    })
  }, [dealData.id, optimisticProducts, pmAction, showToast, startPMRequestTransition])

  const formatCurrency = useCallback((amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }, [])  // Handle search and filter updates - now directly updating state
  const updateSearch = useCallback((term: string) => {
    console.log('Search term updated:', term)
    setSearchTerm(term)
  }, [])

  const updateFilter = useCallback((type: 'all' | 'contract') => {
    console.log('Filter type updated:', type)
    setFilterType(type)
  }, [])

  if (!optimisticProducts || optimisticProducts.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No products found in this deal.</p>
      </div>
    )
  }
  // Get current error state from any of the actions
  const currentError = state.error || clearState.error || pmState.error
  const isUpdating = isPending || isPMRequestPending

  return (    <ContractProvider
      products={optimisticProducts}
      searchTerm={searchTerm}
      filterType={filterType}
      setSearchTerm={updateSearch}
      setFilterType={updateFilter}
      formatCurrency={formatCurrency}
    >
      <div className="space-y-2">        {/* Deal Header */}
        <DealHeader />

        {/* Loading State */}
        {isUpdating && (
          <LoadingState hasContractProduct={hasContractProduct} />
        )}

        {/* Error State */}
        {currentError && (
          <ErrorState error={currentError} />
        )}        {/* Products Section */}
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
                lastUpdatedProduct={state.lastUpdatedProduct}
                onProductSelection={handleProductSelection}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </form>        {/* Action Buttons */}        
        <ActionButtons
          isUpdating={isUpdating}
          isPMRequestPending={isPMRequestPending}
          hasContractProduct={hasContractProduct}
          dealData={dealData}
          onCloseAndClear={handleCloseAndClear}
          onGeneratePMRequest={handleGeneratePMRequest}
        />
      </div>
    </ContractProvider>
  )
}
