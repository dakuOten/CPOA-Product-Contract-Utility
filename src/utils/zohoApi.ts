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

    console.log('API Config:', JSON.stringify(apiConfig, null, 2));    // Use modern async/await with Zoho SDK
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.updateRecord(apiConfig)
          .then((response: unknown) => {
            console.log('Raw Zoho API Response:', response);
            resolve(response as ZohoUpdateResponse);
          })
          .catch((error: unknown) => {
            console.error('Zoho API Error Details:', error);
            reject(error);
          });
      });
    });console.log('=== ZOHO API UPDATE SUCCESS ===');
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
  try {    const response = await zohoApiCall<ZohoApiResponse>(async () => {
      return new Promise<ZohoApiResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.getRecord({
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

    console.log('API Config for clearing contracts:', JSON.stringify(apiConfig, null, 2));    // Use modern async/await with Zoho SDK
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.updateRecord(apiConfig)
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

    console.log('API Config for Contract_Product update:', JSON.stringify(apiConfig, null, 2));    // Update the field
    const response = await zohoApiCall<ZohoUpdateResponse>(async () => {
      return new Promise<ZohoUpdateResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.updateRecord(apiConfig)
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

// Additional interfaces for PM Request generation
interface ZohoDealRecord extends Record<string, unknown> {
  id: string;
  Account_Name?: { id: string; name?: string } | string;
  Contact_Name?: { id: string; name?: string } | string;
  Description?: string;
  Curent_Services?: string;
  Account_Number?: string;
  Circuit_Id?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zip_Code1?: string;
  Service_Street?: string;
  Service_City?: string;
  Service_State?: string;
  Service_Zip_Code?: string;
  Porting_Moving_TNs?: boolean;
  Data_Interface_Type?: string;
  Contract_ID_ADIVB_Number?: string;
  Sub_Account_ID?: string;
  Subform_1?: ZohoProductSubform[];
}

interface ZohoContact extends Record<string, unknown> {
  id: string;
  Email?: string;
  Phone?: string;
}

interface PMRequestData extends Record<string, unknown> {
  Request_Type: string;
  Deals: string;
  Company_Name: string;
  Billing_Address: string;
  Service_Address: string;
  Contact_Person: string | null;
  Email: string;
  Phone: string;
  Request_Descriptions: string;
  Requested_Services: string;
  Current_Account_Number: string;
  New_Circuit_ID: string;
  Assigned_PM: string;
  Product_Type: string;
  Requested_Term: string;
  Requested_Data_Hand_Off: string;
  Circuit_ID: string;  Current_MRC: number;
  Are_we_Moving_TNs: boolean;
  Contract_ID_Number_ADIVB_Number: string;
  Sub_Account_ID: string;
}

/**
 * Generate PM Request by creating a new record directly using Zoho CRM insertRecord API
 * Replicates the logic from automation.generate_pm_request_type_contract function
 * @param dealId - The Zoho Deal ID to create PM Request for
 * @returns Promise with the insertion response
 */
export async function generatePMRequest(dealId: string): Promise<{ data: { code: string; details: { id: string } }[] }> {
  console.log('=== CREATING PM REQUEST USING ZOHO SDK ===')
  console.log('Deal ID:', dealId)
  console.log('API: ZOHO.CRM.API.insertRecord')
  
  try {    // Step 1: Get Deal record with all required data
    console.log('Step 1: Fetching deal record...')
    const dealResponse = await zohoApiCall(async () => {
      return await window.ZOHO!.CRM!.API!.getRecord({
        Entity: 'Deals',
        RecordID: dealId
      }) as ZohoApiResponse
    })
    
    if (!dealResponse.data || dealResponse.data.length === 0) {
      throw new Error(`Deal with ID ${dealId} not found`)
    }
    
    const dealData = dealResponse.data[0] as ZohoDealRecord
    console.log('Deal data retrieved:', dealData)// Step 2: Get contact information from deal record
    console.log('Step 2: Extracting contact info from deal...')
    let primaryContactEmail = ''  // Use empty string instead of 'N/A' for email validation
    let primaryContactPhone = ''  // Use empty string instead of '0' 
    let primaryContactId: string | null = null
      // Alternative approach: Use account information or deal contact fields if available
    try {
      // Check if deal has direct contact fields
      if (dealData.Contact_Name && 
          typeof dealData.Contact_Name === 'object' && 
          'id' in dealData.Contact_Name && 
          dealData.Contact_Name.id) {        console.log('Found contact reference in deal, fetching contact details...')
        const contactResponse = await zohoApiCall(async () => {
          return await window.ZOHO!.CRM!.API!.getRecord({
            Entity: 'Contacts',
            RecordID: (dealData.Contact_Name as { id: string }).id
          }) as ZohoApiResponse
        })
          if (contactResponse.data && contactResponse.data.length > 0) {
          const contact = contactResponse.data[0] as ZohoContact
          primaryContactEmail = contact.Email || ''  // Use empty string for invalid emails
          primaryContactPhone = contact.Phone || ''  // Use empty string for missing phone
          primaryContactId = (dealData.Contact_Name as { id: string }).id
          console.log('Contact found via deal reference:', { email: primaryContactEmail, phone: primaryContactPhone })
        }
      } else if (dealData.Account_Name && 
                 typeof dealData.Account_Name === 'object' && 
                 'id' in dealData.Account_Name && 
                 dealData.Account_Name.id) {        console.log('No direct contact found, trying to get account primary contact...')
        // Try to get account record and use its primary contact
        const accountResponse = await zohoApiCall(async () => {
          return await window.ZOHO!.CRM!.API!.getRecord({
            Entity: 'Accounts',
            RecordID: (dealData.Account_Name as { id: string }).id
          }) as ZohoApiResponse
        })
        
        if (accountResponse.data && accountResponse.data.length > 0) {
          const account = accountResponse.data[0] as Record<string, unknown>
          // Check if account has contact fields
          if (account.Primary_Contact && 
              typeof account.Primary_Contact === 'object' && 
              account.Primary_Contact !== null &&
              'id' in account.Primary_Contact &&
              (account.Primary_Contact as { id: string }).id) {            const contactResponse = await zohoApiCall(async () => {
              return await window.ZOHO!.CRM!.API!.getRecord({
                Entity: 'Contacts',
                RecordID: (account.Primary_Contact as { id: string }).id
              }) as ZohoApiResponse
            })
              if (contactResponse.data && contactResponse.data.length > 0) {
              const contact = contactResponse.data[0] as ZohoContact
              primaryContactEmail = contact.Email || ''  // Use empty string for invalid emails
              primaryContactPhone = contact.Phone || ''  // Use empty string for missing phone
              primaryContactId = (account.Primary_Contact as { id: string }).id
              console.log('Contact found via account primary contact:', { email: primaryContactEmail, phone: primaryContactPhone })
            }
          }
        }
      }
        // If still no contact found, use default values
      if (primaryContactEmail === '') {
        console.log('No primary contact found, using empty values for email/phone')
      }
      
    } catch (contactError) {
      console.warn('Could not fetch contact information:', contactError)
      // Continue with default values
    }
    // Step 3: Process products to find contract product
    console.log('Step 3: Processing products...')
    const products = dealData.Subform_1 || []
    let contractProductType = 'N/A'
    let contractTerm = 'N/A'
    let mrcTotal = 0
    let dataHandOff = ''
    let circuitId = ''
    let movingTns = false
    let contractIdNumber = ''
    let subAccountId = ''
    
    if (products.length > 1) {
      // Multiple products - find the one marked as contract
      const accComplex = ['12', '24', '36', 'MTM']
      const accComplexRenewal = ['12-Renewal', '24-Renewal', '36-Renewal', '42-Renewal']
      let selectedGroupMCR = ''
      
      for (const product of products) {
        if (product.Is_Contract === true) {
          const productType = product.Product_Type || ''
          const terms = product.Terms || ''
            if ((productType === 'ACC-Complex' || productType === 'AT&T Complex') && accComplex.includes(terms)) {
            contractProductType = productType.replace('-', ' ')
            contractTerm = terms.replace('-', ' ')
            selectedGroupMCR = product.Product_Grouping || ''
            movingTns = dealData.Porting_Moving_TNs || false
            dataHandOff = dealData.Data_Interface_Type || ''
            circuitId = dealData.Circuit_Id || ''
            subAccountId = dealData.Sub_Account_ID || ''
            break
          } else if ((productType === 'ACC-Complex' || productType === 'AT&T Complex') && accComplexRenewal.includes(terms)) {
            contractProductType = productType.replace('-', ' ')
            contractTerm = terms.replace('-', ' ')
            selectedGroupMCR = product.Product_Grouping || ''
            circuitId = dealData.Circuit_Id || ''
            contractIdNumber = dealData.Contract_ID_ADIVB_Number || ''
            subAccountId = dealData.Sub_Account_ID || ''
            break
          } else {
            selectedGroupMCR = product.Product_Grouping || ''
            contractProductType = productType
            contractTerm = terms
            break
          }
        }
      }
      
      // Calculate MRC total for the selected product group
      for (const product of products) {
        if (product.Product_Grouping === selectedGroupMCR) {
          const totalPricing = typeof product.Total_Pricing === 'string' 
            ? parseFloat(product.Total_Pricing.replace(/,/g, '')) 
            : product.Total_Pricing
          mrcTotal += totalPricing || 0
        }
      }
    } else if (products.length === 1) {
      // Single product - use it directly
      contractProductType = products[0].Product_Type || ''
      contractTerm = products[0].Terms || ''
    }
    
    console.log('Contract product details:', { contractProductType, contractTerm, mrcTotal })
    
    // Step 4: Build addresses
    const serviceAddress = [
      dealData.Street || '',
      dealData.City || '',
      dealData.State || '',
      dealData.Zip_Code1 || ''
    ].filter(Boolean).join(' ')
    
    const billingAddress = [
      dealData.Service_Street || '',
      dealData.Service_City || '',
      dealData.Service_State || '',
      dealData.Service_Zip_Code || ''
    ].filter(Boolean).join(' ')
      // Step 5: Create PM Request record
    console.log('Step 5: Creating PM Request record...')
    // Handle Account_Name which can be either string or object
    const companyName = dealData.Account_Name && 
                       typeof dealData.Account_Name === 'object' && 
                       'id' in dealData.Account_Name
      ? (dealData.Account_Name as { id: string }).id 
      : dealData.Account_Name || ''
    
    // Validate email format - only include if it's a valid email
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }
    
    const validatedEmail = primaryContactEmail && isValidEmail(primaryContactEmail) ? primaryContactEmail : ''
    
    console.log('Contact validation:', { 
      originalEmail: primaryContactEmail, 
      validatedEmail, 
      isValid: isValidEmail(primaryContactEmail) 
    })
      const pmRequestData: PMRequestData = {
      Request_Type: 'Contract',
      Deals: dealId,
      Company_Name: companyName,
      Billing_Address: billingAddress,
      Service_Address: serviceAddress,
      Contact_Person: primaryContactId,
      Email: validatedEmail,  // Use validated email (empty string if invalid)
      Phone: primaryContactPhone,
      Request_Descriptions: dealData.Description || '',
      Requested_Services: dealData.Curent_Services || '',
      Current_Account_Number: dealData.Account_Number || '',
      New_Circuit_ID: dealData.Circuit_Id || '',
      Assigned_PM: 'Johnly Quindiagan',
      // Contract Details
      Product_Type: contractProductType,
      Requested_Term: contractTerm,
      Requested_Data_Hand_Off: dataHandOff,
      Circuit_ID: circuitId,
      Current_MRC: mrcTotal,
      Are_we_Moving_TNs: movingTns,
      Contract_ID_Number_ADIVB_Number: contractIdNumber,
      Sub_Account_ID: subAccountId
    }
    
    console.log('PM Request data to be created:', pmRequestData)
      // Insert the PM Request record
    const insertResponse = await zohoApiCall(async () => {
      return await window.ZOHO!.CRM!.API!.insertRecord({
        Entity: 'PM_REQUEST',
        APIData: pmRequestData,
        Trigger: ['approval', 'workflow', 'blueprint']
      }) as { data: { code: string; details: { id: string } }[] }
    })
    
    console.log('=== PM REQUEST CREATED SUCCESSFULLY ===')
    console.log('Insert Response:', insertResponse)
    console.log('PM Request ID:', insertResponse.data[0]?.details?.id)
    console.log('==========================================')
    
    return insertResponse
    
  } catch (error) {
    console.error('=== PM REQUEST CREATION FAILED ===')
    console.error('Error:', error)
    console.error('===================================')
    
    // Re-throw with more descriptive error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to create PM Request: ${errorMessage}`)
  }
}
