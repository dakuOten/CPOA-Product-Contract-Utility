import type { ZohoDealRecord } from '../zoho/types'
import type { ZohoDealData } from '../../types/zoho'

// Type for the deal data that can be either format
type DealData = ZohoDealRecord | ZohoDealData

/**
 * Validates required fields for PM Request generation based on Product Type and Term combinations
 * @param productType - The product type (e.g., "AT&T Complex", "ACC Complex")
 * @param term - The term (e.g., "12", "24", "36", "MTM", "12 Renewal", etc.)
 * @param dealData - The Zoho deal record data
 * @returns Array of missing field names
 */
export function validateRequiredFieldsForPMRequest(productType: string, term: string, dealData: DealData): string[] {
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
