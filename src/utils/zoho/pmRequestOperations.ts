import type { ZohoDealRecord } from './types'
import { zohoApiCall, validateZohoAPI } from './core'
import { fetchDealData } from './dealOperations'

// Import modular components
import { validateRequiredFieldsForPMRequest } from './validation/pmRequestValidation'
import { findAndValidatePrimaryContact } from './contact/contactManagement'
import { processContractProducts, extractCompanyName } from './product/productProcessing'
import { buildAddresses } from './address/addressProcessing'
import { buildPMRequestData, validatePMRequestData, logPMRequestSummary } from './pmRequest/pmRequestBuilder'

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
    console.log('✅ Deal data retrieved:', dealData.id)

    // Step 2: Process contract products and extract product information
    console.log('Step 2: Processing contract products...')
    const productInfo = processContractProducts(dealData)
    console.log('✅ Product processing complete')

    // Step 3: Validate required fields based on product configuration
    console.log('Step 3: Validating required fields...')
    const missingRequiredFields = validateRequiredFieldsForPMRequest(
      productInfo.contractProductType, 
      productInfo.contractTerm, 
      dealData
    )
    
    if (missingRequiredFields.length > 0) {
      const errorMessage = `❌ Cannot create PM Request. Missing required fields for ${productInfo.contractProductType} (${productInfo.contractTerm}):\n\n${missingRequiredFields.map(field => `• ${field}`).join('\n')}\n\nPlease ensure all required fields have valid (non-empty) values before generating the PM Request.`
      console.error('🚫 PM Request validation failed:', errorMessage)
      throw new Error(errorMessage)
    }
    
    console.log('✅ All required fields validation passed')

    // Step 4: Find and validate primary contact
    console.log('Step 4: Finding primary contact...')
    const contactInfo = await findAndValidatePrimaryContact(dealId, dealData)
    console.log('✅ Contact processing complete')

    // Step 5: Build addresses
    console.log('Step 5: Building addresses...')
    const addressInfo = buildAddresses(dealData)
    console.log('✅ Address processing complete')

    // Step 6: Extract company name
    console.log('Step 6: Extracting company information...')
    const companyName = extractCompanyName(dealData.Account_Name)
    console.log('✅ Company name extracted:', companyName)

    // Step 7: Build PM Request data
    console.log('Step 7: Building PM Request data...')
    const pmRequestData = buildPMRequestData({
      dealId,
      dealData,
      contactInfo,
      productInfo,
      addressInfo,
      companyName
    })

    // Step 8: Final validation of PM Request data
    console.log('Step 8: Final PM Request data validation...')
    const dataValidationIssues = validatePMRequestData(pmRequestData)
    if (dataValidationIssues.length > 0) {
      const errorMessage = `❌ PM Request data validation failed:\n\n${dataValidationIssues.map(issue => `• ${issue}`).join('\n')}`
      console.error('🚫 Data validation failed:', errorMessage)
      throw new Error(errorMessage)
    }

    // Step 9: Log summary and submit
    console.log('Step 9: Submitting PM Request...')
    logPMRequestSummary(pmRequestData)
    
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
