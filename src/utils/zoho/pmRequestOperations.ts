import type { ZohoDealRecord, ZohoContact, PMRequestData } from './types'
import { zohoApiCall, validateZohoAPI } from './core'
import { fetchDealData, fetchContactData, fetchAccountData, findDealPrimaryContact } from './dealOperations'

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
  
  validateZohoAPI()
  
  try {
    // Step 1: Get Deal record with all required data
    console.log('Step 1: Fetching deal record...')
    const dealResponse = await fetchDealData(dealId)
    
    if (!dealResponse.data || dealResponse.data.length === 0) {
      throw new Error(`Deal with ID ${dealId} not found`)
    }
    
    const dealData = dealResponse.data[0] as ZohoDealRecord
    console.log('Deal data retrieved:', dealData)    // Step 2: Get contact information from deal record using Contact Roles (like Zoho function)
    console.log('Step 2: Finding Primary Contact via Contact Roles...')
    let primaryContactEmail = ''
    let primaryContactPhone = ''
    let primaryContactId: string | null = null

    // First, try the Contact Roles approach (replicating the Zoho function logic)
    try {
      const primaryContact = await findDealPrimaryContact(dealId)
      
      if (primaryContact.contactId) {
        primaryContactEmail = primaryContact.email
        primaryContactPhone = primaryContact.phone
        primaryContactId = primaryContact.contactId
        console.log('Primary Contact found via Contact Roles:', {
          id: primaryContactId,
          email: primaryContactEmail,
          phone: primaryContactPhone
        })
      } else {
        console.log('No Primary Contact found via Contact Roles, trying fallback methods...')
      }
    } catch (contactRoleError) {
      console.warn('Contact Roles method failed:', contactRoleError)
    }

    // Fallback methods if Contact Roles didn't work
    if (!primaryContactId) {
      console.log('Trying fallback contact finding methods...')
      
      try {
        // Check if deal has direct contact fields
        if (dealData.Contact_Name && 
            typeof dealData.Contact_Name === 'object' && 
            'id' in dealData.Contact_Name && 
            dealData.Contact_Name.id) {
          
          console.log('Found contact reference in deal, fetching contact details...')
          const contactResponse = await fetchContactData((dealData.Contact_Name as { id: string }).id)
          
          if (contactResponse.data && contactResponse.data.length > 0) {
            const contact = contactResponse.data[0] as ZohoContact
            primaryContactEmail = contact.Email || ''
            primaryContactPhone = contact.Phone || ''
            primaryContactId = (dealData.Contact_Name as { id: string }).id
            console.log('Contact found via deal reference:', { email: primaryContactEmail, phone: primaryContactPhone })
          }
        } else if (dealData.Account_Name && 
                   typeof dealData.Account_Name === 'object' && 
                   'id' in dealData.Account_Name && 
                   dealData.Account_Name.id) {
          
          console.log('No direct contact found, trying to get account primary contact...')
          // Try to get account record and use its primary contact
          const accountResponse = await fetchAccountData((dealData.Account_Name as { id: string }).id)
          
          if (accountResponse.data && accountResponse.data.length > 0) {
            const account = accountResponse.data[0] as Record<string, unknown>
            // Check if account has contact fields
            if (account.Primary_Contact && 
                typeof account.Primary_Contact === 'object' && 
                account.Primary_Contact !== null &&
                'id' in account.Primary_Contact &&
                (account.Primary_Contact as { id: string }).id) {
              
              const contactResponse = await fetchContactData((account.Primary_Contact as { id: string }).id)
              
              if (contactResponse.data && contactResponse.data.length > 0) {
                const contact = contactResponse.data[0] as ZohoContact
                primaryContactEmail = contact.Email || ''
                primaryContactPhone = contact.Phone || ''
                primaryContactId = (account.Primary_Contact as { id: string }).id
                console.log('Contact found via account primary contact:', { email: primaryContactEmail, phone: primaryContactPhone })
              }
            }
          }
        }
        
        // If still no contact found, use default values
        if (!primaryContactId) {
          console.log('No primary contact found using any method, using empty values for email/phone')
        }
        
      } catch (contactError) {
        console.warn('Could not fetch contact information:', contactError)
        // Continue with default values
      }
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
      Assigned_PM: 'Marifel Esperida',
      // Contract Details
      Product_Type: contractProductType,
      Requested_Term: contractTerm,
      Requested_Data_Hand_Off: dataHandOff,
      Circuit_ID: circuitId,      Current_MRC: mrcTotal,
      Are_we_Moving_TNs: movingTns,
      Contract_ID_Number_ADIVB_Number: contractIdNumber,
      Sub_Account_ID: subAccountId,
      Status : "Pending"
    }
    
    console.log('PM Request data to be created:', pmRequestData)
    
    // Insert the PM Request record
    console.log('Step 6: Inserting PM Request record into Zoho CRM...')
    const insertResponse = await zohoApiCall(async () => {
      return await window.ZOHO!.CRM!.API!.insertRecord({
        Entity: 'PM_REQUEST',
        APIData: pmRequestData,
        Trigger: ['approval', 'workflow', 'blueprint']      }) as { data: { code: string; details: { id: string } }[] }
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
