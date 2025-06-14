import type { ZohoDealRecord } from '../types'
import type { ZohoProductSubform } from '../../../types/zoho'

/**
 * Product Processing Module
 * Handles contract product processing and MRC calculations
 */

export interface ProcessedProductInfo {
  contractProductType: string
  contractTerm: string
  mrcTotal: number
  dataHandOff: string
  circuitId: string
  movingTns: boolean
  contractIdNumber: string
  subAccountId: string
}

/**
 * Processes products to extract contract product information and calculate MRC
 * @param dealData - The deal record containing product subform data
 * @returns Processed product information
 */
export function processContractProducts(dealData: ZohoDealRecord): ProcessedProductInfo {
  console.log('🔍 Processing contract products...')
  
  const products = dealData.Subform_1 || []
  
  // Initialize default values
  const result: ProcessedProductInfo = {
    contractProductType: 'N/A',
    contractTerm: 'N/A',
    mrcTotal: 0,
    dataHandOff: '',
    circuitId: '',
    movingTns: false,
    contractIdNumber: '',
    subAccountId: ''
  }

  if (products.length === 0) {
    console.log('⚠️  No products found in deal')
    return result
  }

  if (products.length === 1) {
    return processSingleProduct(products[0], dealData)
  } else {
    return processMultipleProducts(products, dealData)
  }
}

/**
 * Processes a single product scenario
 */
function processSingleProduct(product: ZohoProductSubform, dealData: ZohoDealRecord): ProcessedProductInfo {
  console.log('📋 Processing single product scenario')
  
  const contractProductType = product.Product_Type || ''
  const contractTerm = product.Terms || ''
  
  // Calculate MRC for single product
  const totalPricing = parseProductPricing(product.Total_Pricing)
  const mrcTotal = totalPricing || 0
  
  const result: ProcessedProductInfo = {
    contractProductType,
    contractTerm,
    mrcTotal,
    dataHandOff: dealData.Data_Interface_Type || '',
    circuitId: dealData.Circuit_Id || '',
    movingTns: dealData.Porting_Moving_TNs || false,
    contractIdNumber: dealData.Contract_ID_ADIVB_Number || '',
    subAccountId: dealData.Sub_Account_ID || ''
  }
  
  console.log('✅ Single product configuration:', result)
  return result
}

/**
 * Processes multiple products scenario - finds the contract product
 */
function processMultipleProducts(products: ZohoProductSubform[], dealData: ZohoDealRecord): ProcessedProductInfo {
  console.log('📋 Processing multiple products scenario')
  
  const accComplex = ['12', '24', '36', 'MTM']
  const accComplexRenewal = ['12-Renewal', '24-Renewal', '36-Renewal', '42-Renewal']
  
  let selectedGroupMCR = ''
  let contractProduct: ZohoProductSubform | null = null
  
  // Find the contract product
  for (const product of products) {
    if (product.Is_Contract === true) {
      contractProduct = product
      selectedGroupMCR = product.Product_Grouping || ''
      
      const productType = product.Product_Type || ''
      const terms = product.Terms || ''
      const normalizedProductType = productType.replace(/-/g, ' ').trim()
      
      console.log('🎯 Found contract product:', { 
        originalProductType: productType, 
        normalizedProductType, 
        terms,
        productGrouping: selectedGroupMCR
      })
      
      // Check if this matches our complex product patterns
      if (isComplexProduct(normalizedProductType, terms, accComplex, accComplexRenewal)) {
        console.log('✅ Matched complex product pattern')
        break
      } else {
        console.log('✅ Using general contract product')
        break
      }
    }
  }
  
  if (!contractProduct) {
    console.log('⚠️  No contract product found')
    return {
      contractProductType: 'N/A',
      contractTerm: 'N/A',
      mrcTotal: 0,
      dataHandOff: '',
      circuitId: '',
      movingTns: false,
      contractIdNumber: '',
      subAccountId: ''
    }
  }
  
  // Calculate MRC total for the selected product group
  const mrcTotal = calculateGroupMRC(products, selectedGroupMCR)
  
  // Determine which fields to populate based on product type and terms
  const { dataHandOff, circuitId, contractIdNumber, subAccountId, movingTns } = 
    determineRequiredFields(contractProduct, dealData, accComplex, accComplexRenewal)
  
  const result: ProcessedProductInfo = {
    contractProductType: contractProduct.Product_Type || '',
    contractTerm: contractProduct.Terms || '',
    mrcTotal,
    dataHandOff,
    circuitId,
    movingTns,
    contractIdNumber,
    subAccountId
  }
  
  console.log('✅ Multiple products configuration:', result)
  return result
}

/**
 * Checks if a product matches complex product patterns
 */
function isComplexProduct(
  normalizedProductType: string, 
  terms: string, 
  accComplex: string[], 
  accComplexRenewal: string[]
): boolean {
  const isComplexType = normalizedProductType === 'ACC Complex' || normalizedProductType === 'AT&T Complex'
  const isStandardTerm = accComplex.includes(terms)
  const isRenewalTerm = accComplexRenewal.includes(terms)
  
  return isComplexType && (isStandardTerm || isRenewalTerm)
}

/**
 * Determines which fields should be populated based on product configuration
 */
function determineRequiredFields(
  contractProduct: ZohoProductSubform,
  dealData: ZohoDealRecord,
  accComplex: string[],
  accComplexRenewal: string[]
): Pick<ProcessedProductInfo, 'dataHandOff' | 'circuitId' | 'contractIdNumber' | 'subAccountId' | 'movingTns'> {
  const productType = contractProduct.Product_Type || ''
  const terms = contractProduct.Terms || ''
  const normalizedProductType = productType.replace(/-/g, ' ').trim()
  
  const result = {
    dataHandOff: '',
    circuitId: '',
    contractIdNumber: '',
    subAccountId: '',
    movingTns: false
  }
  
  if ((normalizedProductType === 'ACC Complex' || normalizedProductType === 'AT&T Complex') && accComplex.includes(terms)) {
    // Standard terms configuration
    result.dataHandOff = dealData.Data_Interface_Type || ''
    result.circuitId = dealData.Circuit_Id || ''
    result.movingTns = dealData.Porting_Moving_TNs || false
    result.subAccountId = dealData.Sub_Account_ID || ''
    console.log('📋 Applied standard terms field configuration')
  } else if ((normalizedProductType === 'ACC Complex' || normalizedProductType === 'AT&T Complex') && accComplexRenewal.includes(terms)) {
    // Renewal terms configuration
    result.circuitId = dealData.Circuit_Id || ''
    result.contractIdNumber = dealData.Contract_ID_ADIVB_Number || ''
    result.subAccountId = dealData.Sub_Account_ID || ''
    console.log('📋 Applied renewal terms field configuration')
  } else {
    // General product configuration
    result.dataHandOff = dealData.Data_Interface_Type || ''
    result.circuitId = dealData.Circuit_Id || ''
    result.movingTns = dealData.Porting_Moving_TNs || false
    result.contractIdNumber = dealData.Contract_ID_ADIVB_Number || ''
    result.subAccountId = dealData.Sub_Account_ID || ''
    console.log('📋 Applied general product field configuration')
  }
  
  return result
}

/**
 * Calculates total MRC for a product group
 */
function calculateGroupMRC(products: ZohoProductSubform[], selectedGroupMCR: string): number {
  let mrcTotal = 0
  
  console.log('💰 Calculating MRC for product group:', selectedGroupMCR)
  
  for (const product of products) {
    if (product.Product_Grouping === selectedGroupMCR) {
      const totalPricing = parseProductPricing(product.Total_Pricing)
      mrcTotal += totalPricing || 0
      
      console.log(`  + Product MRC: ${totalPricing} (${product.Products?.name || 'Unknown Product'})`)
    }
  }
  
  console.log(`💰 Total Group MRC: ${mrcTotal}`)
  return mrcTotal
}

/**
 * Safely parses product pricing from string or number
 */
function parseProductPricing(pricing: string | number | undefined): number {
  if (typeof pricing === 'number') {
    return pricing
  }
  
  if (typeof pricing === 'string') {
    // Remove commas and parse as float
    const cleanedPricing = pricing.replace(/,/g, '')
    const parsed = parseFloat(cleanedPricing)
    return isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

/**
 * Extracts company name from Account_Name field (handles both string and object formats)
 */
export function extractCompanyName(accountName: unknown): string {
  if (accountName && 
      typeof accountName === 'object' && 
      'name' in accountName) {
    return (accountName as { name: string }).name
  }
  
  if (typeof accountName === 'string') {
    return accountName
  }
  
  return ''
}
