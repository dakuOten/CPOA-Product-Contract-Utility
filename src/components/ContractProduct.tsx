import React, { useState, useEffect } from 'react'
import type { ZohoDealData, ZohoProductSubform } from '../types/zoho'
import { updateProductContractStatus, showNotification, clearAllContractSelections, closeWidget, generatePMRequest } from '../utils/zohoApi'

interface ContractProductProps {
  dealData: ZohoDealData
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function ContractProduct({ dealData, showToast }: ContractProductProps) {
  // Use local state for products to allow updates after API calls
  const [products, setProducts] = useState<ZohoProductSubform[]>(() => dealData.Subform_1 || [])
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [lastUpdatedProduct, setLastUpdatedProduct] = useState<string | null>(null)
  const [autoSelectionApplied, setAutoSelectionApplied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'contract' | 'main'>('all')
  
  // Update products when dealData changes
  useEffect(() => {
    setProducts(dealData.Subform_1 || [])
  }, [dealData.Subform_1])
  // Check if there's a contract product selected
  const hasContractProduct = products.some(product => product.Is_Contract)

  // Filter products based on search term and filter type
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.Products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Product_Type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.Vendor && product.Vendor.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterType === 'all' || 
      (filterType === 'contract' && product.Is_Contract) ||
      (filterType === 'main' && product.Main_Product)

    return matchesSearch && matchesFilter
  })

  // Auto-select single product as contract item
  useEffect(() => {
    const autoSelectSingleProduct = async () => {
      // Only auto-select if:
      // 1. There's exactly one product
      // 2. It's not already marked as contract
      // 3. We haven't already applied auto-selection
      // 4. We're not currently updating
      if (
        products.length === 1 && 
        !products[0].Is_Contract && 
        !autoSelectionApplied && 
        !isUpdating &&
        dealData.id
      ) {
        console.log('=== AUTO-SELECTING SINGLE PRODUCT AS CONTRACT ===')
        console.log('Product:', products[0].Products.name)
        console.log('Deal ID:', dealData.id)
        
        setIsUpdating(true)
        setAutoSelectionApplied(true)
        
        try {          await updateProductContractStatus(
            dealData.id,
            0, // First (and only) product index
            products[0],
            products
          )
          
          // Update local state to reflect the auto-selected contract
          setProducts(prevProducts => 
            prevProducts.map((product, index) => ({
              ...product,
              Is_Contract: index === 0 // Only the first product should be marked as contract
            }))
          )
          
          setLastUpdatedProduct(products[0].Products.id)
          
          showNotification(
            `Automatically selected "${products[0].Products.name}" as the contract item (only product in deal).`,
            'success'
          )
          
          console.log('=== AUTO-SELECTION COMPLETED SUCCESSFULLY ===')
          
        } catch (error) {
          console.error('=== AUTO-SELECTION FAILED ===')
          console.error('Error:', error)
          
          setUpdateError(
            `Failed to auto-select contract product: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          
          // Reset auto-selection flag on error so user can try manual selection
          setAutoSelectionApplied(false)
        } finally {
          setIsUpdating(false)
        }
      }
    }

    // Run auto-selection after component mounts and products are available
    if (products.length > 0) {
      autoSelectSingleProduct()
    }  }, [products, dealData.id, autoSelectionApplied, isUpdating])

  // Set up cleanup when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Note: This will be called but may not complete due to browser limitations
      // Create a local cleanup function to avoid dependency issues
      const cleanup = async () => {
        console.log('=== WIDGET CLOSING - CLEARING CONTRACT SELECTIONS ===')
        try {
          if (products.length > 0 && dealData.id) {
            await clearAllContractSelections(dealData.id, products)
            console.log('Contract selections cleared successfully on widget close')
          }
          
          // Notify client script and close widget
          closeWidget('Widget cleanup completed - notifying client script')
          
        } catch (error) {
          console.error('Failed to clear contract selections on widget close:', error)
          // Still close the widget even if clearing fails
          closeWidget('Widget closing with error - notifying client script')
        }
      }
      cleanup()
    }

    // Listen for page unload events
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // DON'T call cleanup here - it causes premature widget closure during re-renders
      // Only clear selections on actual page unload (beforeunload event) or manual close actions
    }
  }, [products, dealData.id]) // Include the dependencies we actually use
  // Debug logging to check deal data and ID
  console.log('=== DEAL DATA DEBUG ===')
  console.log('Full dealData object:', dealData)
  console.log('dealData.id:', dealData.id)
  console.log('Deal ID type:', typeof dealData.id)
  console.log('Products count:', products.length)
  console.log('======================')
    const handleProductSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default form submission behavior and stop event propagation
    event.preventDefault()
    event.stopPropagation()
    
    // Get values directly from the radio button and deal data (simpler approach)
    const selectedProductIndex = event.target.value
    const dealId = dealData.id
    const isChecked = event.target.checked
    
    console.log('=== RADIO BUTTON SELECTION DEBUG ===')
    console.log('selectedProductIndex from radio:', selectedProductIndex)
    console.log('dealId from dealData:', dealId)
    console.log('event.target.checked:', isChecked)
    console.log('===================================')
    
    // Only proceed if the radio button is being checked (not unchecked)
    if (selectedProductIndex !== null && dealId && isChecked) {
      const productIndex = parseInt(selectedProductIndex as string)
      const selectedProduct = products[productIndex]
      
      console.log('=== CONTRACT PRODUCT SELECTION START (EXCLUSIVE) ===')
      console.log('Deal ID:', dealId)
      console.log('Selected Product Index:', productIndex)
      console.log('Complete Product Record:', selectedProduct)
      console.log('Current Contract Status:', selectedProduct.Is_Contract)
      console.log('=================================================')
      
      // Clear previous errors and start update (always update to ensure exclusive selection)
      setUpdateError(null)
      setIsUpdating(true)
        try {
        // Call Zoho API to update the product
        const response = await updateProductContractStatus(
          dealId as string,
          productIndex,
          selectedProduct,
          products // Pass all products for proper subform update
        )
          console.log('=== CONTRACT UPDATE SUCCESS (EXCLUSIVE) ===')
        console.log('API Response:', response)
        console.log('Previous contract products have been unset')
        console.log('Only selected product is now marked as contract')
        console.log('==========================================')

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
        console.error('=== CONTRACT UPDATE FAILED ===')
        console.error('Error:', error)
        console.error('===============================')
        
        setUpdateError(
          `Failed to update contract status: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
          // Show error notification
        showNotification(
          `Failed to tag product as contract item`,
          'error'
        );
      } finally {
        setIsUpdating(false)
      }
    }
  }
  // Handle manual close and clear action
  const handleCloseAndClear = async () => {
    console.log('=== MANUAL CLOSE & CLEAR TRIGGERED ===');
    setIsUpdating(true);
    setUpdateError(null);    try {
      await clearAllContractSelections(dealData.id, products)
      
      console.log('=== CONTRACT SELECTIONS CLEARED SUCCESSFULLY ===')
      
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
      console.error('=== FAILED TO CLEAR CONTRACT SELECTIONS ===')
      console.error('Error:', error)
      
      setUpdateError(
        `Failed to clear contract selections: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      
      // Even if clearing fails, still notify client and close
      closeWidget('Manual close with error - notifying client script')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle PM Request generation
  const handleGeneratePMRequest = async () => {
    console.log('=== GENERATING PM REQUEST ===')
    
    const contractProduct = products.find(product => product.Is_Contract)
    if (!contractProduct) {
      setUpdateError('No contract product selected. Please select a product first.')
      return
    }

    console.log('Contract Product:', contractProduct.Products.name)
    console.log('Deal ID:', dealData.id)
      setIsUpdating(true)
    setUpdateError(null)
    
    try {
      // Call the Zoho automation function
      const response = await generatePMRequest(dealData.id)
      
      console.log('=== PM REQUEST CREATED SUCCESSFULLY ===')
      console.log('Response:', response)
      
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
      console.error('=== PM REQUEST CREATION FAILED ===')
      console.error('Error:', error)
      
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
  }

  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }
  if (!products || products.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No products found in this deal.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {/* Enhanced Deal Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 11-2 0 1 1 0 012 0zm-3 3a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-bold text-blue-900">
                {dealData.Deal_Name}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-600 font-medium">Account:</span>
                <span className="text-blue-900 font-semibold">{dealData.Account_Name.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-600 font-medium">Stage:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {dealData.Stage}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span className="text-green-600 font-medium">Amount:</span>
                <span className="text-green-900 font-bold">{formatCurrency(dealData.Amount)}</span>
              </div>
              
              {dealData.Owner && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600 font-medium">Owner:</span>
                  <span className="text-gray-900 font-semibold">{dealData.Owner.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-blue-200 text-blue-700">
              {products.length} Product{products.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>{/* Loading State */}
      {isUpdating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-blue-800">
              {hasContractProduct && products.find(p => p.Is_Contract) 
                ? 'Processing request...' 
                : 'Updating contract status...'}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-800">{updateError}</p>
          </div>        </div>
      )}      <form className="space-y-4" onSubmit={(e: React.FormEvent) => e.preventDefault()}>        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                  <span>Products ({products.length})</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select a product to tag as the contract item. This will update the Zoho CRM record immediately.
                </p>
              </div>
            </div>

            {/* Search and Filter Controls */}
            {products.length > 1 && (
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
            )}

            {/* Results Summary */}
            {(searchTerm || filterType !== 'all') && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
                {searchTerm && (
                  <span className="ml-2">
                    • Search: "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </div>
            )}
          </div>          <div className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
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
                    className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map((product) => {
                // Find the original index in the full products array
                const originalIndex = products.findIndex(p => p.Products.id === product.Products.id)
                return (
                  <div
                    key={`${product.Products.id}-${originalIndex}`}
                    className={`p-6 transition-all duration-200 ${
                      product.Is_Contract 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  ><div className="flex items-start justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start space-x-3">                      <input
                        type="radio"
                        name="selectedProduct"
                        value={originalIndex}
                        checked={product.Is_Contract}
                        onChange={handleProductSelection}
                        disabled={isUpdating}
                        className={`w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 ${
                          isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      /><div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 break-words text-lg">
                              {product.Products.name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                {product.Product_Type}
                              </span>
                              {product.Vendor && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {product.Vendor}
                                </span>
                              )}
                              {product.Product_Grouping && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                  </svg>
                                  {product.Product_Grouping}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>                    <div className="mt-3 space-y-3">
                      {/* Primary product details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</span>
                            <span className="text-sm font-semibold text-gray-900">{product.Quantity}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terms</span>
                            <span className="text-sm font-semibold text-gray-900">{product.Terms}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pricing details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Unit Price</span>
                            <span className="text-sm font-bold text-blue-900">{formatCurrency(product.Pricing)}</span>
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Price</span>
                            <span className="text-sm font-bold text-green-900">{formatCurrency(product.Total_Pricing)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Vendor information (if available) */}
                    </div>
                  </div>                  <div className="flex-shrink-0">
                    {product.Is_Contract && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        Contract Item
                      </span>
                    )}
                    {lastUpdatedProduct === product.Products.id && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2 whitespace-nowrap">
                        Just Updated
                      </span>
                    )}
                    {product.Main_Product && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2 whitespace-nowrap">
                        Main Product
                      </span>
                    )}
                    </div>                </div>
                </div>
                  )
                })
              )}
            </div>
        </div>
      </form>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Total Products: {products.length}
          </span>
          <span className="text-gray-600">
            Total Value: {formatCurrency(
              products.reduce((sum, p) => sum + parseFloat(p.Total_Pricing.replace(/,/g, '')), 0)
            )}
          </span>
        </div>      </div>      {/* Action Buttons Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Clear Contract Selections */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Clear Contract Selections
              </h3>
              <p className="text-xs text-gray-600">
                Remove all contract selections and close the widget
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseAndClear}
              disabled={isUpdating}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                isUpdating
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
              }`}
            >
              {isUpdating ? 'Clearing...' : 'Close & Clear All'}
            </button>
          </div>
        </div>
      </div>      {/* PM Request Generation Button (visible only when a contract product is selected) */}
      {hasContractProduct && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Generate PM Request
              </h3>
              <p className="text-xs text-gray-600">
                Create a PM Request for the selected contract product
              </p>
            </div>
            <button
              type="button"
              onClick={handleGeneratePMRequest}
              disabled={isUpdating}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                isUpdating
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
              }`}
            >
              {isUpdating ? 'Generating...' : 'Generate PM Request'}
            </button>
          </div>        </div>
      )}
    </div>
  )
}
