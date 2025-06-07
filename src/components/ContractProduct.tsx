import React, { useState, useEffect } from 'react'
import type { ZohoDealData, ZohoProductSubform } from '../types/zoho'
import { updateProductContractStatus, showNotification, clearAllContractSelections, closeWidget } from '../utils/zohoApi'

interface ContractProductProps {
  dealData: ZohoDealData
}

export default function ContractProduct({ dealData }: ContractProductProps) {  
  const products: ZohoProductSubform[] = dealData.Subform_1 || []
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [lastUpdatedProduct, setLastUpdatedProduct] = useState<string | null>(null)
  const [autoSelectionApplied, setAutoSelectionApplied] = useState(false)

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
        
        try {
          await updateProductContractStatus(
            dealData.id,
            0, // First (and only) product index
            products[0],
            products
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
    }
  }, [products, dealData.id, autoSelectionApplied, isUpdating])

  // Cleanup function to clear all contract selections when widget closes
  const handleWidgetClose = async () => {
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

  // Set up cleanup when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Note: This will be called but may not complete due to browser limitations
      handleWidgetClose()
    }

    // Listen for page unload events
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Call cleanup when component unmounts
      handleWidgetClose()
    }
  }, [products, dealData.id])

  // Debug logging to check deal data and ID
  console.log('=== DEAL DATA DEBUG ===')
  console.log('Full dealData object:', dealData)
  console.log('dealData.id:', dealData.id)
  console.log('Deal ID type:', typeof dealData.id)
  console.log('Products count:', products.length)
  console.log('======================')
  
  const handleProductSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const formData = new FormData(event.currentTarget.form!)
    const selectedProductIndex = formData.get('selectedProduct')
    const dealId = formData.get('dealId')
    
    console.log('=== FORM DATA DEBUG ===')
    console.log('selectedProductIndex from form:', selectedProductIndex)
    console.log('dealId from form:', dealId)
    console.log('dealData.id direct access:', dealData.id)
    console.log('========================')
      if (selectedProductIndex !== null && dealId) {
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
        console.log('==========================================')        // Mark as successfully updated
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
  const handleCloseAndClear = async () => {    console.log('=== MANUAL CLOSE & CLEAR TRIGGERED ===');
    setIsUpdating(true);
    setUpdateError(null);

    try {
      await clearAllContractSelections(dealData.id, products)
      
      console.log('=== CONTRACT SELECTIONS CLEARED SUCCESSFULLY ===')
      
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
  }  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Deal: {dealData.Deal_Name}
        </h2>
        <p className="text-sm text-blue-700">
          Account: {dealData.Account_Name.name} | Stage: {dealData.Stage}
        </p>
      </div>

      {/* Loading State */}
      {isUpdating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-blue-800">Updating contract status...</p>
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
          </div>
        </div>
      )}<form className="space-y-4">
        {/* Hidden field for Deal ID */}
        <input type="hidden" name="dealId" value={dealData.id} />
        
        <div className="bg-white rounded-lg border border-gray-200">          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900">
              Products ({products.length})
            </h3>            <p className="text-sm text-gray-600">
              Select a product to tag as the contract item. Only one product can be marked as contract at a time. This will update the Zoho CRM record immediately. Use the "Close & Clear All" button when finished.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {products.map((product, index) => (
              <div
                key={`${product.Products.id}-${index}`}
                className={`p-4 transition-colors ${
                  product.Is_Contract ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                }`}
              >                <div className="flex items-start justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start space-x-3"><input
                        type="radio"
                        name="selectedProduct"
                        value={index}
                        checked={product.Is_Contract}
                        onChange={handleProductSelection}
                        disabled={isUpdating}
                        className={`w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 ${
                          isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                        <div className="flex-1 min-w-0">                        <h4 className="font-medium text-gray-900 break-words">
                          {product.Products.name}
                        </h4>
                        <p className="text-sm text-gray-600 break-words">
                          {product.Product_Type}
                        </p>
                      </div>
                    </div>                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-gray-500 whitespace-nowrap">Quantity:</span>
                        <span className="sm:ml-1 font-medium break-all">{product.Quantity}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-gray-500 whitespace-nowrap">Terms:</span>
                        <span className="sm:ml-1 font-medium break-words">{product.Terms}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-gray-500 whitespace-nowrap">Unit Price:</span>
                        <span className="sm:ml-1 font-medium break-all">{formatCurrency(product.Pricing)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-gray-500 whitespace-nowrap">Total:</span>
                        <span className="sm:ml-1 font-medium break-all">{formatCurrency(product.Total_Pricing)}</span>
                      </div>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Total Products: {products.length}
          </span>
          <span className="text-gray-600">
            Total Value: {formatCurrency(
              products.reduce((sum, p) => sum + parseFloat(p.Total_Pricing.replace(/,/g, '')), 0)
            )}
          </span>
        </div>      </div>

      {/* Close & Clear Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
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
    </div>
  )
}
