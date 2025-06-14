import type { ZohoDealRecord } from '../types'
import type { ZohoDealData } from '../../../types/zoho'

/**
 * PM Request Validation Module
 * Handles all validation logic for PM Request generation
 */

// Type for deal data that can be either format
type DealDataInput = ZohoDealRecord | ZohoDealData

/**
 * Validates required fields for PM Request generation based on Product Type and Term combinations
 * @param productType - The product type (e.g., "AT&T Complex", "ACC Complex")
 * @param term - The term (e.g., "12", "24", "36", "MTM", "12 Renewal", etc.)
 * @param dealData - The Zoho deal record data
 * @returns Array of missing field names
 */
export function validateRequiredFieldsForPMRequest(
  productType: string, 
  term: string, 
  dealData: DealDataInput
): string[] {
  const missingFields: string[] = []
  const normalizedProductType = productType.replace(/-/g, ' ').trim()
  const normalizedTerm = term.replace(/-/g, ' ').trim()
  
  console.log('🔍 PM Request Validation for:', { 
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
    }  })
  
  // Validate basic required fields
  missingFields.push(...validateBasicRequiredFields(dealData, normalizedProductType, normalizedTerm))
  
  // Validate product-specific required fields
  missingFields.push(...validateProductSpecificFields(dealData, normalizedProductType, normalizedTerm))
  
  console.log('📊 Validation Summary:', {
    productType: normalizedProductType,
    term: normalizedTerm,
    missingFieldsCount: missingFields.length,
    missingFields: missingFields
  })
  
  return missingFields
}

/**
 * Validates basic required fields (always required for PM Request generation)
 */
function validateBasicRequiredFields(
  dealData: DealDataInput, 
  normalizedProductType: string, 
  normalizedTerm: string
): string[] {
  const missingFields: string[] = []
  const isFieldEmpty = (value: string | undefined | null): boolean => {
    return !value || value.toString().trim() === ''
  }

  console.log('📋 Checking basic required fields...')
  
  // Description
  if (isFieldEmpty(dealData.Description)) {
    missingFields.push('Description')
    console.log('❌ Missing: Description')
  } else {
    console.log('✅ Found: Description =', dealData.Description)
  }
  
  // Current Services
  if (isFieldEmpty(dealData.Curent_Services)) {
    missingFields.push('Current Services')
    console.log('❌ Missing: Current Services')
  } else {
    console.log('✅ Found: Current Services =', dealData.Curent_Services)
  }
  
  // Circuit ID - Special rule: NOT required for AT&T Complex with standard terms (12, 24, 36, MTM)
  const isATTComplexStandardTerms = (normalizedProductType === 'AT&T Complex' || normalizedProductType === 'AT&T-Complex') && 
                                   ['12', '24', '36', 'MTM'].includes(normalizedTerm)
  
  if (isATTComplexStandardTerms) {
    console.log('⚠️  Circuit ID NOT required for AT&T Complex with standard terms')
  } else {
    if (isFieldEmpty(dealData.Circuit_Id)) {
      missingFields.push('Circuit ID')
      console.log('❌ Missing: Circuit ID')
    } else {
      console.log('✅ Found: Circuit ID =', dealData.Circuit_Id)
    }
  }

  return missingFields
}

/**
 * Validates product-specific required fields based on product type and term combinations
 */
function validateProductSpecificFields(
  dealData: DealDataInput, 
  normalizedProductType: string, 
  normalizedTerm: string
): string[] {
  const missingFields: string[] = []
  const isFieldEmpty = (value: string | undefined | null): boolean => {
    return !value || value.toString().trim() === ''
  }

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

  // AT&T Complex with standard terms
  if (isATTComplexWithStandardTerms(normalizedProductType, normalizedTerm)) {
    console.log('📋 ✅ CONDITION MATCHED: AT&T Complex with standard terms...')
    if (isFieldEmpty(dealData.Data_Interface_Type)) {
      missingFields.push('Requested Data Hand-Off')
      console.log('❌ Missing: Requested Data Hand-Off')
    } else {
      console.log('✅ Found: Requested Data Hand-Off =', dealData.Data_Interface_Type)
    }
  }
  
  // ACC Complex with standard terms
  if (isACCComplexWithStandardTerms(normalizedProductType, normalizedTerm)) {
    console.log('📋 ✅ CONDITION MATCHED: ACC Complex with standard terms...')
    if (isFieldEmpty(dealData.Data_Interface_Type)) {
      missingFields.push('Requested Data Hand-Off')
      console.log('❌ Missing: Requested Data Hand-Off')
    } else {
      console.log('✅ Found: Requested Data Hand-Off =', dealData.Data_Interface_Type)
    }
  }
  
  // AT&T Complex with renewal terms
  if (isATTComplexWithRenewalTerms(normalizedProductType, normalizedTerm)) {
    console.log('📋 ✅ CONDITION MATCHED: AT&T Complex with renewal terms...')
    if (isFieldEmpty(dealData.Contract_ID_ADIVB_Number)) {
      missingFields.push('Contract ID Number / ADIVB Number')
      console.log('❌ Missing: Contract ID Number / ADIVB Number')
    } else {
      console.log('✅ Found: Contract ID Number / ADIVB Number =', dealData.Contract_ID_ADIVB_Number)
    }
  }
  
  // ACC Complex with renewal terms
  if (isACCComplexWithRenewalTerms(normalizedProductType, normalizedTerm)) {
    console.log('📋 ✅ CONDITION MATCHED: ACC Complex with renewal terms...')
    if (isFieldEmpty(dealData.Contract_ID_ADIVB_Number)) {
      missingFields.push('Contract ID Number / ADIVB Number')
      console.log('❌ Missing: Contract ID Number / ADIVB Number')
    } else {
      console.log('✅ Found: Contract ID Number / ADIVB Number =', dealData.Contract_ID_ADIVB_Number)
    }
  }

  return missingFields
}

/**
 * Product type and term validation helpers
 */
function isATTComplexWithStandardTerms(productType: string, term: string): boolean {
  return (productType === 'AT&T Complex' || productType === 'AT&T-Complex') && 
         ['12', '24', '36', 'MTM'].includes(term)
}

function isACCComplexWithStandardTerms(productType: string, term: string): boolean {
  return (productType === 'ACC Complex' || productType === 'ACC-Complex') && 
         ['12', '24', '36', 'MTM'].includes(term)
}

function isATTComplexWithRenewalTerms(productType: string, term: string): boolean {
  return (productType === 'AT&T Complex' || productType === 'AT&T-Complex') && 
         ['12 Renewal', '24 Renewal', '36 Renewal'].includes(term)
}

function isACCComplexWithRenewalTerms(productType: string, term: string): boolean {
  return (productType === 'ACC Complex' || productType === 'ACC-Complex') && 
         ['12 Renewal', '24 Renewal', '36 Renewal'].includes(term)
}

/**
 * Email validation helper
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
