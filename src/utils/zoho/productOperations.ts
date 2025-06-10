import type { ZohoProductSubform } from '../../types/zoho'
import type { ZohoUpdateResponse } from './types'
import { zohoApiCall, validateZohoAPI } from './core'

/**
 * Updates a product's Is_Contract field in Zoho CRM Deal subform with exclusive selection
 * IMPORTANT: Implements exclusive contract selection - only one product can be contract at a time
 * Sends ALL products in the subform to prevent data loss
 * Zoho CRM replaces the entire subform array, so all existing records must be included
 * @param dealId - The Zoho Deal ID
 * @param productIndex - Index of the product in the subform array to update
 * @param productData - The complete product record data (for logging/validation)
 * @param allProducts - ALL products in the subform (CRITICAL: prevents other records from being deleted)
 * @returns Promise with the update response
 */
export async function updateProductContractStatus(
  dealId: string,
  productIndex: number,
  productData: ZohoProductSubform,
  allProducts: ZohoProductSubform[]
): Promise<ZohoUpdateResponse> {
  console.log('=== ZOHO API UPDATE START (EXCLUSIVE SELECTION) ===')
  console.log('Deal ID:', dealId)
  console.log('Product Index:', productIndex)
  console.log('Product Data:', productData)
  console.log('All Products Count:', allProducts.length)
  
  validateZohoAPI()
  
  try {
    // EXCLUSIVE CONTRACT SELECTION: Set all other products' Is_Contract to false
    // Only the selected product will have Is_Contract = true
    const updatedProducts = allProducts.map((product, index) => {
      if (index === productIndex) {
        // Update the target product's Is_Contract field to true
        return {
          ...product,
          Is_Contract: true
        }
      } else {
        // Set all other products' Is_Contract to false (exclusive selection)
        return {
          ...product,
          Is_Contract: false
        }
      }
    })
    
    console.log('Target Product Index:', productIndex)
    console.log('All Products Before Update:', allProducts)
    console.log('All Products After Update (EXCLUSIVE):', updatedProducts)
    console.log('Previous contract products will be set to false')

    // CRITICAL: Send ALL products in subform to prevent data loss
    // Zoho replaces the entire subform array, so we must include all records
    const apiConfig = {
      Entity: "Deals",
      APIData: {
        id: dealId,
        Contract_Product: true, // Set to true when a contract product is selected
        Subform_1: updatedProducts // Send ALL products to retain existing records
      },
      Trigger: ["workflow"]
    }

    console.log('API Config:', JSON.stringify(apiConfig, null, 2))

    // Use modern async/await with Zoho SDK
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Raw Zoho API Response:', response)
            resolve(response as ZohoUpdateResponse)
          })
          .catch((error: unknown) => {
            console.error('Zoho API Error Details:', error)
            reject(error)
          })
      })
    })

    console.log('=== ZOHO API UPDATE SUCCESS ===')
    console.log('Response:', response)
    console.log('===============================')

    return response
  } catch (error) {
    console.error('=== ZOHO API UPDATE ERROR ===')
    console.error('Error updating product contract status:', error)
    console.error('Deal ID:', dealId)
    console.error('Product Index:', productIndex)
    console.error('Product Data:', productData)
    console.error('=============================')
    
    throw new Error(
      `Failed to update contract status: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Clears all contract selections by setting Is_Contract to false for all products
 * This is called when the widget is closed to reset the contract selections
 * @param dealId - The Zoho Deal ID
 * @param allProducts - ALL products in the subform
 * @returns Promise with the update response
 */
export async function clearAllContractSelections(
  dealId: string,
  allProducts: ZohoProductSubform[]
): Promise<ZohoUpdateResponse> {
  console.log('=== CLEARING ALL CONTRACT SELECTIONS ===')
  console.log('Deal ID:', dealId)
  console.log('All Products Count:', allProducts.length)

  validateZohoAPI()

  try {
    // Set all products' Is_Contract to false
    const updatedProducts = allProducts.map((product) => ({
      ...product,
      Is_Contract: false
    }))
    
    console.log('All products will have Is_Contract set to false')
    console.log('Updated Products Count:', updatedProducts.length)

    // CRITICAL: Send ALL products in subform to prevent data loss
    const apiConfig = {
      Entity: "Deals",
      APIData: {
        id: dealId,
        Contract_Product: false, // Add Contract_Product field at deal level
        Subform_1: updatedProducts
      },
      Trigger: ["workflow"]
    }

    console.log('API Config for clearing contracts:', JSON.stringify(apiConfig, null, 2))

    // Use modern async/await with Zoho SDK
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Raw Zoho API Response (Clear Contracts):', response)
            resolve(response as ZohoUpdateResponse)
          })
          .catch((error: unknown) => {
            console.error('Zoho API Error Details (Clear Contracts):', error)
            reject(error)
          })
      })
    })

    console.log('=== ALL CONTRACT SELECTIONS CLEARED ===')
    console.log('Response:', response)
    console.log('=======================================')

    return response

  } catch (error) {
    console.error('=== CLEAR CONTRACTS ERROR ===')
    console.error('Error clearing contract selections:', error)
    console.error('Deal ID:', dealId)
    console.error('============================')
    
    throw new Error(
      `Failed to clear contract selections: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Updates Contract_Product field only (without widget closing)
 * This function updates the deal's Contract_Product field
 * @param dealId - The Zoho Deal ID
 * @param contractProductValue - Value to set for Contract_Product field
 * @returns Promise with the update response
 */
export async function updateContractProductField(
  dealId: string,
  contractProductValue: boolean
): Promise<ZohoUpdateResponse> {
  console.log('=== UPDATING CONTRACT_PRODUCT FIELD ===')
  console.log('Deal ID:', dealId)
  console.log('Contract_Product value:', contractProductValue)
  
  validateZohoAPI()
  
  try {
    // Update only the Contract_Product field
    const apiConfig = {
      Entity: "Deals",
      APIData: {
        id: dealId,
        Contract_Product: contractProductValue
      },
      Trigger: ["workflow"]
    }

    console.log('API Config for Contract_Product update:', JSON.stringify(apiConfig, null, 2))

    // Update the field
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Contract_Product update response:', response)
            resolve(response as ZohoUpdateResponse)
          })
          .catch((error: unknown) => {
            console.error('Contract_Product update error:', error)
            reject(error)
          })
      })
    })

    console.log('=== CONTRACT_PRODUCT UPDATED SUCCESSFULLY ===')
    console.log('Response:', response)
    
    return response
    
  } catch (error) {
    console.error('=== CONTRACT_PRODUCT UPDATE FAILED ===')
    console.error('Error:', error)
    
    throw new Error(
      `Failed to update Contract_Product field: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
