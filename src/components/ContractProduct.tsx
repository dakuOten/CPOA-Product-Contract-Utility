import { useState, useCallback, useMemo, useRef } from 'react'
import type { ZohoDealData, ZohoProductSubform } from '../types/zoho'
import { updateProductContractStatus, showNotification, clearAllContractSelections, closeWidget, generatePMRequest } from '../utils/zohoApi'
import DealHeader from './DealHeader'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import ProductFilters from './ProductFilters'
import ProductList from './ProductList'
import ActionButtons from './ActionButtons'

// Extend Window interface for our cleanup functions
declare global {
  interface Window {
    __contractWidgetCleanupSet?: boolean
    __contractWidgetCleanup?: () => Promise<void>
  }
}

// Custom hook for managing product state with auto-selection logic
function useProductState(initialData: ZohoDealData) {
  const [products, setProducts] = useState<ZohoProductSubform[]>(() => initialData.Subform_1 || [])
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [lastUpdatedProduct, setLastUpdatedProduct] = useState<string | null>(null)
  const autoSelectionRef = useRef(false)
  const manualSelectionRef = useRef(false) // Track manual interactions
  
  // Update products when dealData changes (replacing useEffect)
  if (initialData.Subform_1 !== products && !isUpdating) {
    setProducts(initialData.Subform_1 || [])
  }
    // Auto-selection logic moved to a function that can be called imperatively
  const handleAutoSelection = useCallback(async (dealId: string) => {
    if (
      products.length === 1 && 
      !products[0].Is_Contract && 
      !autoSelectionRef.current && 
      !manualSelectionRef.current && // Prevent auto-selection if user has manually interacted
      !isUpdating &&
      dealId
    ) {
      autoSelectionRef.current = true
      setIsUpdating(true)
      
      try {
        await updateProductContractStatus(dealId, 0, products[0], products)
        
        setProducts(prevProducts => 
          prevProducts.map((product, index) => ({
            ...product,
            Is_Contract: index === 0
          }))
        )
        
        setLastUpdatedProduct(products[0].Products.id)
        
        showNotification(
          `Automatically selected "${products[0].Products.name}" as the contract item (only product in deal).`,
          'success'
        )
        
      } catch (error) {
        setUpdateError(
          `Failed to auto-select contract product: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        autoSelectionRef.current = false
      } finally {
        setIsUpdating(false)
      }
    }
  }, [products, isUpdating])
  
  // Function to mark manual selection
  const markManualSelection = useCallback(() => {
    manualSelectionRef.current = true
  }, [])
  
  return {
    products,
    setProducts,
    isUpdating,
    setIsUpdating,
    updateError,
    setUpdateError,
    lastUpdatedProduct,
    setLastUpdatedProduct,
    handleAutoSelection,
    markManualSelection
  }
}

// Custom hook for cleanup logic
function useCleanup(products: ZohoProductSubform[], dealId: string) {
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
  
  // Set up cleanup listeners only once using window object
  if (!window.__contractWidgetCleanupSet) {
    window.__contractWidgetCleanupSet = true
    
    const handleBeforeUnload = () => {
      cleanupRef.current?.()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
      // Store cleanup function globally for access from other parts of the app
    window.__contractWidgetCleanup = async () => {
      if (cleanupRef.current) {
        await cleanupRef.current()
      }
    }
  }
}

interface ContractProductProps {
  dealData: ZohoDealData
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function ContractProduct({ dealData, showToast }: ContractProductProps) {  // Use custom hooks for state management
  const {
    products,
    setProducts,
    isUpdating,
    setIsUpdating,
    updateError,
    setUpdateError,
    lastUpdatedProduct,
    setLastUpdatedProduct,
    handleAutoSelection,
    markManualSelection
  } = useProductState(dealData)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'contract' | 'main'>('all')
    // Use cleanup hook
  useCleanup(products, dealData.id)
  
  // Call auto-selection when appropriate but only if no manual interaction has occurred
  // This prevents auto-selection from interfering with manual selection
  const shouldAutoSelect = products.length === 1 && 
    !products[0].Is_Contract && 
    !isUpdating &&
    !products.some(p => p.Is_Contract) // No product is already selected
  
  if (shouldAutoSelect) {
    // Use a microtask to avoid state update during render
    Promise.resolve().then(() => {
      handleAutoSelection(dealData.id)
    })
  }// Check if there's a contract product selected
  const hasContractProduct = useMemo(() => {
    return products.some(product => product.Is_Contract)
  }, [products])
  
  // Filter products based on search term and filter type
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.Products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Product_Type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.Vendor && product.Vendor.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesFilter = filterType === 'all' || 
        (filterType === 'contract' && product.Is_Contract) ||
        (filterType === 'main' && product.Main_Product)

      return matchesSearch && matchesFilter
    })
  }, [products, searchTerm, filterType])
  const handleProductSelection = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Mark that user has manually interacted to prevent auto-selection
    markManualSelection()
    
    // Prevent default form submission behavior and stop event propagation
    event.preventDefault()
    event.stopPropagation()
    
    // Get values directly from the radio button and deal data (simpler approach)
    const selectedProductIndex = event.target.value
    const dealId = dealData.id
    const isChecked = event.target.checked

    // Only proceed if the radio button is being checked (not unchecked)
    if (selectedProductIndex !== null && dealId && isChecked) {
      const productIndex = parseInt(selectedProductIndex as string)
      const selectedProduct = products[productIndex]
      
      // Clear previous errors and start update (always update to ensure exclusive selection)
      setUpdateError(null)
      setIsUpdating(true)
      
      try {
        // Call Zoho API to update the product
        await updateProductContractStatus(
          dealId as string,
          productIndex,
          selectedProduct,
          products // Pass all products for proper subform update
        )

        // Update local state to reflect the changes immediately
        setProducts(prevProducts => 
          prevProducts.map((product, index) => ({
            ...product,
            Is_Contract: index === productIndex // Only the selected product should be marked as contract
          }))
        )

        // Mark as successfully updated
        setLastUpdatedProduct(selectedProduct.Products.id)
        
        // Show success notification (no auto-close)
        showNotification(
          `Successfully tagged "${selectedProduct.Products.name}" as the contract item.`,
          'success'
        )
        
      } catch (error) {
        setUpdateError(
          `Failed to update contract status: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        
        // Show error notification
        showNotification(
          `Failed to tag product as contract item`,
          'error'
        )
      } finally {
        setIsUpdating(false)
      }
    }
  }, [dealData.id, products, setUpdateError, setIsUpdating, setProducts, setLastUpdatedProduct, markManualSelection])
  
  // Handle manual close and clear action
  const handleCloseAndClear = useCallback(async () => {
    setIsUpdating(true)
    setUpdateError(null)
    
    try {
      await clearAllContractSelections(dealData.id, products)
      
      // Update local state to reflect cleared contracts
      setProducts(prevProducts => 
        prevProducts.map(product => ({
          ...product,
          Is_Contract: false
        }))
      )
      
      // Close widget after successful clear
      closeWidget('Contract selections cleared successfully - closing widget')
      
    } catch (error) {
      setUpdateError(
        `Failed to clear contract selections: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      
      // Even if clearing fails, still notify client and close
      closeWidget('Manual close with error - notifying client script')
    } finally {
      setIsUpdating(false)
    }
  }, [dealData.id, products, setIsUpdating, setUpdateError, setProducts])
  
  // Handle PM Request generation
  const handleGeneratePMRequest = useCallback(async () => {
    const contractProduct = products.find(product => product.Is_Contract)
    if (!contractProduct) {
      setUpdateError('No contract product selected. Please select a product first.')
      return
    }

    setIsUpdating(true)
    setUpdateError(null)
    
    try {
      // Call the Zoho automation function
      await generatePMRequest(dealData.id)
      
      // Show success toast
      showToast(
        `PM Request created successfully for "${contractProduct.Products.name}"`,
        'success'
      )
      
      showNotification(
        `PM Request created successfully for "${contractProduct.Products.name}"`,
        'success'
      )
      
    } catch (error) {
      const errorMessage = `Failed to create PM Request: ${error instanceof Error ? error.message : 'Unknown error'}`
      
      setUpdateError(errorMessage)
      
      // Show error toast
      showToast(errorMessage, 'error')
      
      showNotification(
        'Failed to create PM Request',
        'error'
      )
    } finally {
      setIsUpdating(false)
    }
  }, [dealData.id, products, showToast, setIsUpdating, setUpdateError])
  const formatCurrency = useCallback((amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }, [])

  if (!products || products.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No products found in this deal.</p>
      </div>
    )
  }  return (
    <div className="space-y-2">
      {/* Deal Header */}
      <DealHeader 
        dealData={dealData} 
        productsCount={products.length} 
        formatCurrency={formatCurrency}
      />

      {/* Loading State */}
      {isUpdating && (
        <LoadingState hasContractProduct={hasContractProduct} />
      )}

      {/* Error State */}
      {updateError && (
        <ErrorState error={updateError} />
      )}

      {/* Products Section */}
      <form className="space-y-3" onSubmit={(e: React.FormEvent) => e.preventDefault()}>        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                  <span>Products ({products.length})</span>
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Select a product to tag as the contract item. This will update the Zoho CRM record immediately.
                </p>
              </div>
            </div>

            {/* Product Filters */}
            <ProductFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterType={filterType}
              setFilterType={setFilterType}
              productsCount={products.length}
              filteredProductsCount={filteredProducts.length}
              showFilters={products.length > 1}
            />
          </div>

          {/* Product List */}
          <div className="divide-y divide-gray-200">
            <ProductList
              filteredProducts={filteredProducts}
              allProducts={products}
              searchTerm={searchTerm}
              filterType={filterType}
              setSearchTerm={setSearchTerm}
              setFilterType={setFilterType}
              isUpdating={isUpdating}
              lastUpdatedProduct={lastUpdatedProduct}
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
        products={products}
        formatCurrency={formatCurrency}
        onCloseAndClear={handleCloseAndClear}
        onGeneratePMRequest={handleGeneratePMRequest}
      />
    </div>
  )
}
