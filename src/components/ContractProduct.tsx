import { 
  useActionState, 
  useOptimistic, 
  useMemo, 
  useRef, 
  useState,
  useEffect,
  createContext, 
  startTransition,
  useCallback
} from 'react'
import type { ZohoDealData, ZohoProductSubform } from '../types/zoho'
import { updateProductContractStatus, showNotification, clearAllContractSelections, closeWidget, generatePMRequest } from '../utils/zohoApi'
import DealHeader from './DealHeader'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import ProductFilters from './ProductFilters'
import ProductList from './ProductList'
import ActionButtons from './ActionButtons'

// Contract Context for sharing state between components
const ContractContext = createContext<{
  products: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract'
  setSearchTerm: (term: string) => void
  setFilterType: (type: 'all' | 'contract') => void
  formatCurrency: (amount: string | number) => string
} | null>(null)

// Types for our action state
interface ContractActionState {
  products: ZohoProductSubform[]
  lastUpdatedProduct: string | null
  error: string | null
  success: string | null
  isAutoSelectionApplied: boolean
}

// Action functions for form actions
async function productSelectionAction(
  currentState: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const dealId = formData.get('dealId') as string
  const productIndex = parseInt(formData.get('productIndex') as string)
  const productsData = formData.get('products') as string
  const products: ZohoProductSubform[] = JSON.parse(productsData)
  
  try {
    const selectedProduct = products[productIndex]
    
    // Call Zoho API to update the product
    await updateProductContractStatus(
      dealId,
      productIndex,
      selectedProduct,
      products
    )

    // Update products with new contract status
    const updatedProducts = products.map((product, index) => ({
      ...product,
      Is_Contract: index === productIndex
    }))

    // Show success notification
    showNotification(
      `Successfully tagged "${selectedProduct.Products.name}" as the contract item.`,
      'success'
    )

    return {
      ...currentState,
      products: updatedProducts,
      lastUpdatedProduct: selectedProduct.Products.id,
      error: null,
      success: `Product "${selectedProduct.Products.name}" selected as contract item`
    }
  } catch (error) {
    const errorMessage = `Failed to update contract status: ${error instanceof Error ? error.message : 'Unknown error'}`
    
    showNotification('Failed to tag product as contract item', 'error')
    
    return {
      ...currentState,
      error: errorMessage,
      success: null
    }
  }
}

async function clearContractsAction(
  currentState: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const dealId = formData.get('dealId') as string
  const productsData = formData.get('products') as string
  const products: ZohoProductSubform[] = JSON.parse(productsData)
  
  try {
    await clearAllContractSelections(dealId, products)
    
    const updatedProducts = products.map(product => ({
      ...product,
      Is_Contract: false
    }))
    
    closeWidget('Contract selections cleared successfully - closing widget')
    
    return {
      ...currentState,
      products: updatedProducts,
      error: null,
      success: 'All contract selections cleared'
    }
  } catch (error) {
    const errorMessage = `Failed to clear contract selections: ${error instanceof Error ? error.message : 'Unknown error'}`
    closeWidget('Manual close with error - notifying client script')
    
    return {
      ...currentState,
      error: errorMessage,
      success: null
    }
  }
}

async function generatePMRequestAction(
  currentState: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const dealId = formData.get('dealId') as string
  const productsData = formData.get('products') as string
  const products: ZohoProductSubform[] = JSON.parse(productsData)
  
  const contractProduct = products.find(product => product.Is_Contract)
  if (!contractProduct) {
    return {
      ...currentState,
      error: 'No contract product selected. Please select a product first.',
      success: null
    }
  }

  try {
    await generatePMRequest(dealId)
    
    showNotification(
      `PM Request created successfully for "${contractProduct.Products.name}"`,
      'success'
    )
    
    return {
      ...currentState,
      error: null,
      success: `PM Request created for "${contractProduct.Products.name}"`
    }
  } catch (error) {
    const errorMessage = `Failed to create PM Request: ${error instanceof Error ? error.message : 'Unknown error'}`
    
    showNotification('Failed to create PM Request', 'error')
    
    return {
      ...currentState,
      error: errorMessage,
      success: null
    }
  }
}

// Custom hook for cleanup logic using React 19 patterns
function useContractCleanup(products: ZohoProductSubform[], dealId: string) {
  const cleanupRef = useRef<(() => Promise<void>) | undefined>(undefined)
  
  cleanupRef.current = useCallback(async () => {
    try {
      if (products.length > 0 && dealId) {
        await clearAllContractSelections(dealId, products)
      }
      closeWidget('Widget cleanup completed - notifying client script')
    } catch (error) {
      console.error('Failed to clear contract selections on widget close:', error)
      closeWidget('Widget closing with error - notifying client script')
    }
  }, [products, dealId])
  
  // Set up cleanup listeners only once
  if (typeof window !== 'undefined' && !window.__contractWidgetCleanupSet) {
    window.__contractWidgetCleanupSet = true
    
    const handleBeforeUnload = () => {
      cleanupRef.current?.()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.__contractWidgetCleanup = async () => {
      if (cleanupRef.current) {
        await cleanupRef.current()
      }
    }
  }
}

// Context provider component
function ContractProvider({ children, products, searchTerm, filterType, setSearchTerm, setFilterType, formatCurrency }: {
  children: React.ReactNode
  products: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract'
  setSearchTerm: (term: string) => void
  setFilterType: (type: 'all' | 'contract') => void
  formatCurrency: (amount: string | number) => string
}) {
  const contextValue = useMemo(() => ({
    products,
    searchTerm,
    filterType,
    setSearchTerm,
    setFilterType,
    formatCurrency
  }), [products, searchTerm, filterType, setSearchTerm, setFilterType, formatCurrency])

  return (
    <ContractContext value={contextValue}>
      {children}
    </ContractContext>
  )
}

// Extend Window interface for our cleanup functions
declare global {
  interface Window {
    __contractWidgetCleanupSet?: boolean
    __contractWidgetCleanup?: () => Promise<void>
  }
}

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

  // Handle PM Request generation
  const handleGeneratePMRequest = useCallback(() => {
    const contractProduct = optimisticProducts.find(product => product.Is_Contract)
    if (!contractProduct) {
      showToast('No contract product selected. Please select a product first.', 'error')
      return
    }

    startTransition(() => {
      const formData = new FormData()
      formData.append('dealId', dealData.id)
      formData.append('products', JSON.stringify(optimisticProducts))
      
      pmAction(formData)
      
      // Show optimistic toast
      showToast(
        `Creating PM Request for "${contractProduct.Products.name}"...`,
        'info'
      )
    })
  }, [dealData.id, optimisticProducts, pmAction, showToast])

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
  const isUpdating = isPending

  return (    <ContractProvider
      products={optimisticProducts}
      searchTerm={searchTerm}
      filterType={filterType}
      setSearchTerm={updateSearch}
      setFilterType={updateFilter}
      formatCurrency={formatCurrency}
    >
      <div className="space-y-2">
        {/* Deal Header */}
        <DealHeader 
          dealData={dealData} 
          productsCount={optimisticProducts.length} 
          formatCurrency={formatCurrency}
        />

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
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                    <span>Products ({optimisticProducts.length})</span>
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Select a product to tag as the contract item. This will update the Zoho CRM record immediately.
                  </p>
                </div>
              </div>              {/* Product Filters */}
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

            {/* Product List */}
            <div className="divide-y divide-gray-200">              <ProductList
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
        </form>

        {/* Action Buttons */}
        <ActionButtons
          isUpdating={isUpdating}
          hasContractProduct={hasContractProduct}
          products={optimisticProducts}
          formatCurrency={formatCurrency}
          onCloseAndClear={handleCloseAndClear}
          onGeneratePMRequest={handleGeneratePMRequest}
        />
      </div>
    </ContractProvider>
  )
}
