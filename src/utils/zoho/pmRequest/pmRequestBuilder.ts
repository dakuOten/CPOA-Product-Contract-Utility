import type { ZohoDealRecord, PMRequestData } from '../types'
import type { ContactInfo } from '../contact/contactManagement'
import type { ProcessedProductInfo } from '../product/productProcessing'
import type { AddressInfo } from '../address/addressProcessing'

/**
 * PM Request Data Builder Module
 * Constructs PM Request data from processed components
 */

export interface PMRequestBuilderInput {
  dealId: string
  dealData: ZohoDealRecord
  contactInfo: ContactInfo
  productInfo: ProcessedProductInfo
  addressInfo: AddressInfo
  companyName: string
}

/**
 * Builds PM Request data from all processed components
 * @param input - All the processed data components
 * @returns Complete PM Request data ready for submission
 */
export function buildPMRequestData(input: PMRequestBuilderInput): PMRequestData {
  console.log('🏗️  Building PM Request data...')
  
  const {
    dealId,
    dealData,
    contactInfo,
    productInfo,
    addressInfo,
    companyName
  } = input
  
  // Normalize product type and term (remove dashes)
  const normalizedProductType = normalizeFieldValue(productInfo.contractProductType)
  const normalizedTerm = normalizeFieldValue(productInfo.contractTerm)
  
  const pmRequestData: PMRequestData = {
    // Basic request information
    Request_Type: 'Contract',
    Deals: dealId,
    Company_Name: companyName,
    Status: 'Pending',
    
    // Contact information
    Contact_Person: contactInfo.id,
    Email: contactInfo.email,
    Phone: contactInfo.phone,
    
    // Address information
    Billing_Address: addressInfo.billingAddress,
    Service_Address: addressInfo.serviceAddress,
    
    // Request details
    Request_Descriptions: dealData.Description || '',
    Requested_Services: dealData.Curent_Services || '',
    Current_Account_Number: dealData.Account_Number || '',
    New_Circuit_ID: dealData.Circuit_Id || '',
    
    // Assignment
    Assigned_PM: 'Marifel Esperida',
    
    // Contract-specific details
    Product_Type: normalizedProductType,
    Requested_Term: normalizedTerm,
    Requested_Data_Hand_Off: productInfo.dataHandOff,
    Circuit_ID: productInfo.circuitId,
    Current_MRC: productInfo.mrcTotal,
    Are_we_Moving_TNs: productInfo.movingTns,
    Contract_ID_Number_ADIVB_Number: productInfo.contractIdNumber,
    Sub_Account_ID: productInfo.subAccountId
  }
  
  console.log('✅ PM Request data built successfully:', {
    dealId,
    requestType: pmRequestData.Request_Type,
    companyName: pmRequestData.Company_Name,
    productType: pmRequestData.Product_Type,
    term: pmRequestData.Requested_Term,
    contactEmail: pmRequestData.Email,
    mrc: pmRequestData.Current_MRC,
    hasContactPerson: !!pmRequestData.Contact_Person,
    hasServiceAddress: !!pmRequestData.Service_Address,
    hasBillingAddress: !!pmRequestData.Billing_Address
  })
  
  return pmRequestData
}

/**
 * Normalizes field values by removing dashes and trimming whitespace
 */
function normalizeFieldValue(value: string): string {
  if (!value) return ''
  return value.replace(/-/g, ' ').trim()
}

/**
 * Validates PM Request data before submission
 */
export function validatePMRequestData(pmRequestData: PMRequestData): string[] {
  const issues: string[] = []
  
  console.log('🔍 Validating PM Request data before submission...')
  
  // Required fields validation
  if (!pmRequestData.Deals) {
    issues.push('Deal ID is missing')
  }
  
  if (!pmRequestData.Company_Name || pmRequestData.Company_Name.trim() === '') {
    issues.push('Company Name is missing')
  }
  
  if (!pmRequestData.Request_Descriptions || pmRequestData.Request_Descriptions.trim() === '') {
    issues.push('Request Description is missing')
  }
  
  if (!pmRequestData.Requested_Services || pmRequestData.Requested_Services.trim() === '') {
    issues.push('Requested Services is missing')
  }
  
  if (!pmRequestData.Product_Type || pmRequestData.Product_Type.trim() === '') {
    issues.push('Product Type is missing')
  }
  
  if (!pmRequestData.Requested_Term || pmRequestData.Requested_Term.trim() === '') {
    issues.push('Requested Term is missing')
  }
  
  // Email validation (if provided)
  if (pmRequestData.Email && pmRequestData.Email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(pmRequestData.Email)) {
      issues.push('Email format is invalid')
    }
  }
  
  // MRC validation
  if (typeof pmRequestData.Current_MRC !== 'number' || pmRequestData.Current_MRC < 0) {
    issues.push('Current MRC must be a valid positive number')
  }
  
  if (issues.length > 0) {
    console.log('❌ PM Request data validation failed:', issues)
  } else {
    console.log('✅ PM Request data validation passed')
  }
  
  return issues
}

/**
 * Logs PM Request data summary for debugging
 */
export function logPMRequestSummary(pmRequestData: PMRequestData): void {
  console.log('📋 PM Request Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📄 Request Type: ${pmRequestData.Request_Type}`)
  console.log(`🏢 Company: ${pmRequestData.Company_Name}`)
  console.log(`📦 Product: ${pmRequestData.Product_Type} (${pmRequestData.Requested_Term})`)
  console.log(`💰 MRC: $${pmRequestData.Current_MRC}`)
  console.log(`👤 Contact: ${pmRequestData.Contact_Person ? `ID: ${pmRequestData.Contact_Person}` : 'None'}`)
  console.log(`📧 Email: ${pmRequestData.Email || 'None'}`)
  console.log(`📞 Phone: ${pmRequestData.Phone || 'None'}`)
  console.log(`🏠 Service Address: ${pmRequestData.Service_Address || 'None'}`)
  console.log(`🏢 Billing Address: ${pmRequestData.Billing_Address || 'None'}`)
  console.log(`🔧 Circuit ID: ${pmRequestData.Circuit_ID || 'None'}`)
  console.log(`📡 Data Hand-Off: ${pmRequestData.Requested_Data_Hand_Off || 'None'}`)
  console.log(`📋 Contract ID: ${pmRequestData.Contract_ID_Number_ADIVB_Number || 'None'}`)
  console.log(`🏷️  Sub Account ID: ${pmRequestData.Sub_Account_ID || 'None'}`)
  console.log(`📱 Moving TNs: ${pmRequestData.Are_we_Moving_TNs ? 'Yes' : 'No'}`)
  console.log(`👨‍💼 Assigned PM: ${pmRequestData.Assigned_PM}`)
  console.log(`📊 Status: ${pmRequestData.Status}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}
