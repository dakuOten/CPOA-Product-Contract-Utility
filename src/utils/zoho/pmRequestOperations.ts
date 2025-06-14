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
    console.log('Deal data retrieved:', dealData)
    
    // Step 2: Get contact information from deal record using Contact Roles (like Zoho function)
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
        for (const product of products) {        if (product.Is_Contract === true) {
          const productType = product.Product_Type || ''
          const terms = product.Terms || ''
          
          // Normalize product type for comparison (handle both ACC-Complex and ACC Complex formats)
          const normalizedProductType = productType.replace(/-/g, ' ').trim()
          
          console.log('Processing contract product:', { 
            originalProductType: productType, 
            normalizedProductType, 
            terms,
            accComplex,
            accComplexRenewal 
          })
          
          if ((normalizedProductType === 'ACC Complex' || normalizedProductType === 'AT&T Complex') && accComplex.includes(terms)) {
            contractProductType = productType
            contractTerm = terms
            selectedGroupMCR = product.Product_Grouping || ''
            movingTns = dealData.Porting_Moving_TNs || false
            dataHandOff = dealData.Data_Interface_Type || ''
            circuitId = dealData.Circuit_Id || ''
            subAccountId = dealData.Sub_Account_ID || ''
            console.log('✅ Matched ACC/AT&T Complex with standard terms:', { contractProductType, contractTerm })
            break
          } else if ((normalizedProductType === 'ACC Complex' || normalizedProductType === 'AT&T Complex') && accComplexRenewal.includes(terms)) {
            contractProductType = productType
            contractTerm = terms
            selectedGroupMCR = product.Product_Grouping || ''
            circuitId = dealData.Circuit_Id || ''
            contractIdNumber = dealData.Contract_ID_ADIVB_Number || ''
            subAccountId = dealData.Sub_Account_ID || ''
            console.log('✅ Matched ACC/AT&T Complex with renewal terms:', { contractProductType, contractTerm })
            break
          } else {
            selectedGroupMCR = product.Product_Grouping || ''
            contractProductType = productType
            contractTerm = terms
            console.log('✅ Matched other product type:', { contractProductType, contractTerm })
            break
          }
        }
      }
      
      // Calculate MRC total for the selected product group
      for (const product of products) {
        if (product.Product_Grouping === selectedGroupMCR) {          const totalPricing = typeof product.Total_Pricing === 'string' 
            ? parseFloat(product.Total_Pricing.replace(/,/g, '')) 
            : product.Total_Pricing
          mrcTotal += totalPricing || 0
        }
      }    } else if (products.length === 1) {
      // Single product - use it directly
      contractProductType = products[0].Product_Type || ''
      contractTerm = products[0].Terms || ''
      
      // Set all the required fields for single product
      movingTns = dealData.Porting_Moving_TNs || false
      dataHandOff = dealData.Data_Interface_Type || ''
      circuitId = dealData.Circuit_Id || ''
      contractIdNumber = dealData.Contract_ID_ADIVB_Number || ''
      subAccountId = dealData.Sub_Account_ID || ''
      
      // Calculate MRC for single product
      const totalPricing = typeof products[0].Total_Pricing === 'string' 
        ? parseFloat(products[0].Total_Pricing.replace(/,/g, ''))
        : products[0].Total_Pricing
      mrcTotal = totalPricing || 0
      
      console.log('✅ Single product configuration:', { 
        contractProductType, 
        contractTerm, 
        mrcTotal,
        dataHandOff,
        circuitId,
        contractIdNumber 
      })
    }
    
    // Handle Account_Name which can be either string or object - use the name, not the ID
    const companyName = dealData.Account_Name && 
                       typeof dealData.Account_Name === 'object' && 
                       'name' in dealData.Account_Name
      ? (dealData.Account_Name as { name: string }).name 
      : (typeof dealData.Account_Name === 'string' ? dealData.Account_Name : '')
    
    console.log('Contract product details:', { contractProductType, contractTerm, mrcTotal })
    console.log('Account Name details:', { Account_Name: dealData.Account_Name, companyName })
    
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
    })    // Step 5.5: Validate required fields based on Product Type and Term combinations
    console.log('Step 5.5: Validating required fields based on product configuration...')
    const validateRequiredFieldsForPMRequest = (productType: string, term: string, dealData: ZohoDealRecord): string[] => {
      const missingFields: string[] = []
      const normalizedProductType = productType.replace(/-/g, ' ').trim()
      const normalizedTerm = term.replace(/-/g, ' ').trim()
      
      console.log('Validation for:', { 
        originalProductType: productType,
        normalizedProductType, 
        originalTerm: term,
        normalizedTerm,
        dealDataFields: {
          Description: dealData.Description,
          Curent_Services: dealData.Curent_Services,
          Circuit_Id: dealData.Circuit_Id,
          Data_Interface_Type: dealData.Data_Interface_Type,
          Contract_ID_ADIVB_Number: dealData.Contract_ID_ADIVB_Number
        }
      })
      
      // Helper function to check if a field is empty or null
      const isFieldEmpty = (value: string | undefined | null): boolean => {
        return !value || value.toString().trim() === ''
      }
        // BASIC REQUIRED FIELDS (Always required for PM Request generation)
      console.log('📋 Checking basic required fields...')
      if (isFieldEmpty(dealData.Description)) {
        missingFields.push('Description')
        console.log('❌ Missing: Description')
      } else {
        console.log('✅ Found: Description =', dealData.Description)
      }
      
      if (isFieldEmpty(dealData.Curent_Services)) {
        missingFields.push('Current Services')
        console.log('❌ Missing: Current Services')
      } else {
        console.log('✅ Found: Current Services =', dealData.Curent_Services)
      }
      
      if (isFieldEmpty(dealData.Circuit_Id)) {
        missingFields.push('Circuit ID')
        console.log('❌ Missing: Circuit ID')
      } else {
        console.log('✅ Found: Circuit ID =', dealData.Circuit_Id)
      }
      
      // PRODUCT-SPECIFIC REQUIRED FIELDS
      console.log('📋 Checking product-specific required fields...')
      
      // Debug: Show exact comparison values
      console.log('🔍 Debug - Comparison Values:', {
        normalizedProductType,
        normalizedTerm,
        isATTComplex: normalizedProductType === 'AT&T Complex',
        isACCComplex: normalizedProductType === 'ACC Complex',
        isStandardTerm: ['12', '24', '36', 'MTM'].includes(normalizedTerm),
        isRenewalTerm: ['12 Renewal', '24 Renewal', '36 Renewal'].includes(normalizedTerm),
        availableStandardTerms: ['12', '24', '36', 'MTM'],
        availableRenewalTerms: ['12 Renewal', '24 Renewal', '36 Renewal']
      })
        // AT&T Complex with 12, 24, 36, MTM - Requested Data Hand-Off is required
      if ((normalizedProductType === 'AT&T Complex' || normalizedProductType === 'AT&T-Complex') && ['12', '24', '36', 'MTM'].includes(normalizedTerm)) {
        console.log('📋 ✅ CONDITION MATCHED: AT&T Complex with standard terms...')
        if (isFieldEmpty(dealData.Data_Interface_Type)) {
          missingFields.push('Requested Data Hand-Off')
          console.log('❌ Missing: Requested Data Hand-Off')
        } else {
          console.log('✅ Found: Requested Data Hand-Off =', dealData.Data_Interface_Type)
        }
      } else {
        console.log('📋 ❌ Condition NOT matched for AT&T Complex with standard terms', {
          productMatch: normalizedProductType === 'AT&T Complex' || normalizedProductType === 'AT&T-Complex',
          termMatch: ['12', '24', '36', 'MTM'].includes(normalizedTerm),
          actualProduct: normalizedProductType,
          actualTerm: normalizedTerm
        })
      }
      
      // ACC Complex with 12, 24, 36, MTM - Requested Data Hand-Off is required (Circuit ID already checked above)
      if ((normalizedProductType === 'ACC Complex' || normalizedProductType === 'ACC-Complex') && ['12', '24', '36', 'MTM'].includes(normalizedTerm)) {
        console.log('📋 ✅ CONDITION MATCHED: ACC Complex with standard terms...')
        if (isFieldEmpty(dealData.Data_Interface_Type)) {
          missingFields.push('Requested Data Hand-Off')
          console.log('❌ Missing: Requested Data Hand-Off')
        } else {
          console.log('✅ Found: Requested Data Hand-Off =', dealData.Data_Interface_Type)
        }
        // Circuit ID already checked in basic validation above
      } else {
        console.log('📋 ❌ Condition NOT matched for ACC Complex with standard terms', {
          productMatch: normalizedProductType === 'ACC Complex' || normalizedProductType === 'ACC-Complex',
          termMatch: ['12', '24', '36', 'MTM'].includes(normalizedTerm),
          actualProduct: normalizedProductType,
          actualTerm: normalizedTerm
        })
      }
      
      // AT&T Complex with 12 Renewal, 24 Renewal, 36 Renewal - Contract ID Number is required (Circuit ID already checked above)
      if ((normalizedProductType === 'AT&T Complex' || normalizedProductType === 'AT&T-Complex') && ['12 Renewal', '24 Renewal', '36 Renewal'].includes(normalizedTerm)) {
        console.log('📋 ✅ CONDITION MATCHED: AT&T Complex with renewal terms...')
        // Circuit ID already checked in basic validation above
        if (isFieldEmpty(dealData.Contract_ID_ADIVB_Number)) {
          missingFields.push('Contract ID Number / ADIVB Number')
          console.log('❌ Missing: Contract ID Number / ADIVB Number')
        } else {
          console.log('✅ Found: Contract ID Number / ADIVB Number =', dealData.Contract_ID_ADIVB_Number)
        }
      } else {
        console.log('📋 ❌ Condition NOT matched for AT&T Complex with renewal terms', {
          productMatch: normalizedProductType === 'AT&T Complex' || normalizedProductType === 'AT&T-Complex',
          termMatch: ['12 Renewal', '24 Renewal', '36 Renewal'].includes(normalizedTerm),
          actualProduct: normalizedProductType,
          actualTerm: normalizedTerm
        })
      }
      
      // ACC Complex with 12 Renewal, 24 Renewal, 36 Renewal - Contract ID Number is required (Circuit ID already checked above)
      if ((normalizedProductType === 'ACC Complex' || normalizedProductType === 'ACC-Complex') && ['12 Renewal', '24 Renewal', '36 Renewal'].includes(normalizedTerm)) {
        console.log('📋 ✅ CONDITION MATCHED: ACC Complex with renewal terms...')
        // Circuit ID already checked in basic validation above
        if (isFieldEmpty(dealData.Contract_ID_ADIVB_Number)) {
          missingFields.push('Contract ID Number / ADIVB Number')
          console.log('❌ Missing: Contract ID Number / ADIVB Number')
        } else {
          console.log('✅ Found: Contract ID Number / ADIVB Number =', dealData.Contract_ID_ADIVB_Number)
        }
      } else {
        console.log('📋 ❌ Condition NOT matched for ACC Complex with renewal terms', {
          productMatch: normalizedProductType === 'ACC Complex' || normalizedProductType === 'ACC-Complex',
          termMatch: ['12 Renewal', '24 Renewal', '36 Renewal'].includes(normalizedTerm),
          actualProduct: normalizedProductType,
          actualTerm: normalizedTerm
        })
      }
      
      console.log('📊 Validation Summary:', {
        productType: normalizedProductType,
        term: normalizedTerm,
        missingFieldsCount: missingFields.length,
        missingFields: missingFields
      })
      
      return missingFields
    }
      // Validate required fields for the contract product
    const missingRequiredFields = validateRequiredFieldsForPMRequest(contractProductType, contractTerm, dealData)
    
    if (missingRequiredFields.length > 0) {
      const errorMessage = `❌ Cannot create PM Request. Missing required fields for ${contractProductType} (${contractTerm}):\n\n${missingRequiredFields.map(field => `• ${field}`).join('\n')}\n\nPlease ensure all required fields have valid (non-empty) values before generating the PM Request.`
      console.error('🚫 PM Request validation failed:', errorMessage)
      throw new Error(errorMessage)
    }
    
    console.log('✅ All required fields validation passed for product configuration')
    console.log('🎯 Ready to create PM Request with validated data')

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
      New_Circuit_ID: dealData.Circuit_Id || '',      Assigned_PM: 'Marifel Esperida',
      // Contract Details
      Product_Type: contractProductType.replace(/-/g, ' '),
      Requested_Term: contractTerm.replace(/-/g, ' '),
      Requested_Data_Hand_Off: dataHandOff,
      Circuit_ID: circuitId,
      Current_MRC: mrcTotal,
      Are_we_Moving_TNs: movingTns,
      Contract_ID_Number_ADIVB_Number: contractIdNumber,
      Sub_Account_ID: subAccountId,
      Status : "Pending"
    }
    
    console.log('PM Request data to be created:', pmRequestData)
    
    // Insert the PM Request record
    console.log('Step 6: Inserting PM Request record into Zoho CRM...')
    const insertResponse = await zohoApiCall(async () => {
      return await window.ZOHO!.CRM!.API!.insertRecord({        Entity: 'PM_REQUEST',
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
