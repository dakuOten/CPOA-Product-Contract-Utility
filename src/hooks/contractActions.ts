import type { ZohoProductSubform } from '../types/zoho'
import { updateProductContractStatus, showNotification, clearAllContractSelections, closeWidget, generatePMRequest } from '../utils/zohoApi'

// Types for our action state
export interface ContractActionState {
  products: ZohoProductSubform[]
  lastUpdatedProduct: string | null
  error: string | null
  success: string | null
  isAutoSelectionApplied: boolean
}

// Action functions for form actions
export async function productSelectionAction(
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

export async function clearContractsAction(
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

export async function generatePMRequestAction(
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
