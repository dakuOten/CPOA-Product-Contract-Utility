import type { ZohoProductSubform } from '../types/zoho'

// Zoho CRM API response types
interface ZohoApiResponse {
  data: unknown[]
  status: string
  message?: string
}

interface ZohoUpdateResponse {
  data: Array<{
    code: string
    details: {
      Modified_Time: string
      Modified_By: {
        name: string
        id: string
      }
      Change_Owner: string
      id: string
      Created_Time: string
    }
    message: string
    status: string
  }>
}

// Helper function to promisify Zoho API calls
async function zohoApiCall<T>(apiFunction: () => Promise<T>): Promise<T> {
  try {
    const result = await apiFunction()
    return result
  } catch (error) {
    console.error('Zoho API Call Error:', error)
    throw new Error(`Zoho API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

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
  // Validate Zoho SDK availability
  if (!window.ZOHO?.CRM?.API) {
    throw new Error('Zoho CRM API not available')
  }
  
  try {
    // EXCLUSIVE CONTRACT SELECTION: Set all other products' Is_Contract to false
    // Only the selected product will have Is_Contract = true
    const updatedProducts = allProducts.map((product, index) => {
      if (index === productIndex) {
        // Update the target product's Is_Contract field to true
        return {
          ...product,
          Is_Contract: true
        }      } else {
        // Set all other products' Is_Contract to false (exclusive selection)
        return {
          ...product,
          Is_Contract: false
        }
      }
    });
    
    console.log('Target Product Index:', productIndex);
    console.log('All Products Before Update:', allProducts);
    console.log('All Products After Update (EXCLUSIVE):', updatedProducts);
    console.log('Previous contract products will be set to false');    // CRITICAL: Send ALL products in subform to prevent data loss
    // Zoho replaces the entire subform array, so we must include all records
    const apiConfig = {
      Entity: "Deals",
      APIData: {
        id: dealId,
        Contract_Product: true, // Set to true when a contract product is selected
        Subform_1: updatedProducts // Send ALL products to retain existing records
      },
      Trigger: ["workflow"]
    };

    console.log('API Config:', JSON.stringify(apiConfig, null, 2));

    // Use modern async/await with Zoho SDK
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO.CRM.API.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Raw Zoho API Response:', response);
            resolve(response as ZohoUpdateResponse);
          })
          .catch((error: unknown) => {
            console.error('Zoho API Error Details:', error);
            reject(error);
          });
      });
    });    console.log('=== ZOHO API UPDATE SUCCESS ===');
    console.log('Response:', response);
    console.log('===============================');

    return response;
  } catch (error) {
    console.error('=== ZOHO API UPDATE ERROR ===');
    console.error('Error updating product contract status:', error);
    console.error('Deal ID:', dealId);
    console.error('Product Index:', productIndex);
    console.error('Product Data:', productData);
    console.error('=============================');
    
    throw new Error(
      `Failed to update contract status: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Fetches deal data from Zoho CRM
 * @param dealId - The Zoho Deal ID
 * @returns Promise with deal data
 */
export async function fetchDealData(dealId: string): Promise<ZohoApiResponse> {
  console.log('=== FETCHING DEAL DATA ===')
  console.log('Deal ID:', dealId)

  if (!window.ZOHO?.CRM?.API) {
    throw new Error('Zoho CRM API not available')
  }
  try {
    const response = await zohoApiCall<ZohoApiResponse>(async () => {
      return new Promise<ZohoApiResponse>((resolve, reject) => {
        window.ZOHO.CRM.API.getRecord({
          Entity: "Deals",
          RecordID: dealId
        })
        .then((response: unknown) => {
          console.log('Deal Data Response:', response);
          resolve(response as ZohoApiResponse);
        })
        .catch((error: unknown) => {
          console.error('Error fetching deal data:', error);
          reject(error);
        });
      });
    });

    console.log('=== DEAL DATA FETCHED SUCCESSFULLY ===');
    return response;
  } catch (error) {
    console.error('=== DEAL DATA FETCH ERROR ===');
    console.error('Error fetching deal data:', error);
    console.error('Deal ID:', dealId);
    console.error('============================');
    
    throw new Error(
      `Failed to fetch deal data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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

  // Validate Zoho SDK availability
  if (!window.ZOHO?.CRM?.API) {
    throw new Error('Zoho CRM API not available')
  }

  try {
    // Set all products' Is_Contract to false
    const updatedProducts = allProducts.map((product) => ({
      ...product,
      Is_Contract: false
    }))
      console.log('All products will have Is_Contract set to false');
    console.log('Updated Products Count:', updatedProducts.length);    // CRITICAL: Send ALL products in subform to prevent data loss
    const apiConfig = {
      Entity: "Deals",
      APIData: {
        id: dealId,
        Contract_Product: false, // Add Contract_Product field at deal level
        Subform_1: updatedProducts
      },
      Trigger: ["workflow"]
    };

    console.log('API Config for clearing contracts:', JSON.stringify(apiConfig, null, 2));

    // Use modern async/await with Zoho SDK
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO.CRM.API.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Raw Zoho API Response (Clear Contracts):', response);
            resolve(response as ZohoUpdateResponse);
          })
          .catch((error: unknown) => {
            console.error('Zoho API Error Details (Clear Contracts):', error);
            reject(error);
          });
      });
    });

    console.log('=== ALL CONTRACT SELECTIONS CLEARED ===');
    console.log('Response:', response);    console.log('=======================================');

    return response;

  } catch (error) {
    console.error('=== CLEAR CONTRACTS ERROR ===');
    console.error('Error clearing contract selections:', error);
    console.error('Deal ID:', dealId);
    console.error('============================');
    
    throw new Error(
      `Failed to clear contract selections: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Shows notification message (logging only)
 * Widget closing will be handled by manual close buttons using $Client.close
 * @param message - Message to display
 * @param type - Type of notification (success, error, info)
 */
export function showNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info'
): void {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Updates Contract_Product field and closes widget
 * This function updates the deal's Contract_Product field before closing
 * @param dealId - The Zoho Deal ID
 * @param contractProductValue - Value to set for Contract_Product field
 * @param message - Optional message to log
 */
export async function updateContractProductAndClose(
  dealId: string,
  contractProductValue: boolean,
  message?: string
): Promise<void> {
  if (message) {
    console.log(message);
  }
  
  console.log('=== UPDATING CONTRACT_PRODUCT FIELD AND CLOSING ===');
  console.log('Deal ID:', dealId);
  console.log('Contract_Product value:', contractProductValue);
  
  try {
    if (!window.ZOHO?.CRM?.API) {
      throw new Error('Zoho CRM API not available');
    }

    // Update only the Contract_Product field
    const apiConfig = {
      Entity: "Deals",
      APIData: {
        id: dealId,
        Contract_Product: contractProductValue
      },
      Trigger: ["workflow"]
    };

    console.log('API Config for Contract_Product update:', JSON.stringify(apiConfig, null, 2));

    // Update the field
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO.CRM.API.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Contract_Product update response:', response);
            resolve(response as ZohoUpdateResponse);
          })
          .catch((error: unknown) => {
            console.error('Contract_Product update error:', error);
            reject(error);
          });
      });
    });

    console.log('=== CONTRACT_PRODUCT UPDATED SUCCESSFULLY ===');
    console.log('Response:', response);
    
    // Close widget after successful update
    closeWidget('Contract_Product field updated, closing widget');
    
  } catch (error) {
    console.error('=== CONTRACT_PRODUCT UPDATE FAILED ===');
    console.error('Error:', error);
    
    // Still close widget even if update fails
    closeWidget('Contract_Product update failed, closing widget anyway');
  }
}

/**
 * Closes widget and notifies client script using $Client.close API
 * This is the primary method for closing the widget
 * @param message - Optional message to log
 */
export function closeWidget(message?: string): void {
  if (message) {
    console.log(message);
  }
  
  try {
    // Use $Client.close to notify client script and close widget
    $Client.close({
      exit: true
    });
    console.log('Widget closed using $Client.close API');
  } catch (error) {
    console.error('Error closing widget with $Client.close:', error);
    
    // Fallback: try regular popup close
    try {
      if (window.ZOHO?.CRM?.UI?.Popup?.close) {
        window.ZOHO.CRM.UI.Popup.close();
        console.log('Widget closed using fallback Popup.close');
      }
    } catch (fallbackError) {
      console.error('Fallback close also failed:', fallbackError);
    }
  }
}

/**
 * Reloads the widget to refresh data from Zoho CRM
 * This helps capture the latest state when Zoho data might be stale
 * @param message - Optional message to log
 */
export function reloadWidget(message?: string): void {
  if (message) {
    console.log(message);
  }
  
  console.log('=== RELOADING WIDGET TO REFRESH DATA ===');
  
  try {
    // Use window.location.reload to refresh the entire widget
    window.location.reload();
    console.log('Widget reloaded successfully');
  } catch (error) {
    console.error('Error reloading widget:', error);
    
    // Fallback: try to use Zoho UI refresh if available
    try {
      if (window.ZOHO?.CRM?.UI?.Popup?.closeReload) {
        window.ZOHO.CRM.UI.Popup.closeReload();
        console.log('Widget reloaded using Zoho closeReload');
      } else {        // As last resort, just reload the page
        window.location.assign(window.location.href);
      }
    } catch (fallbackError) {
      console.error('Fallback reload also failed:', fallbackError);
    }
  }
}
