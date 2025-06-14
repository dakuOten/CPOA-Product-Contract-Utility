import type { ZohoDealRecord, ZohoContact } from '../types'
import { fetchContactData, fetchAccountData, findDealPrimaryContact } from '../dealOperations'

/**
 * Contact Management Module
 * Handles all contact-related operations for PM Request generation
 */

export interface ContactInfo {
  id: string | null
  email: string
  phone: string
  isValid: boolean
}

/**
 * Finds and validates primary contact information for a deal
 * @param dealId - The Zoho Deal ID
 * @param dealData - The deal record data
 * @returns Promise with contact information
 */
export async function findAndValidatePrimaryContact(
  dealId: string, 
  dealData: ZohoDealRecord
): Promise<ContactInfo> {
  console.log('🔍 Finding Primary Contact for Deal:', dealId)
  
  let primaryContactEmail = ''
  let primaryContactPhone = ''
  let primaryContactId: string | null = null
  // Method 1: Contact Roles approach (primary method)
  try {
    console.log('🔍 Attempting to find primary contact via Contact Roles API...')
    const primaryContact = await findDealPrimaryContact(dealId)
    
    console.log('📋 Contact Roles API Response:', {
      contactId: primaryContact.contactId,
      email: primaryContact.email,
      phone: primaryContact.phone,
      hasContactId: !!primaryContact.contactId,
      hasEmail: !!primaryContact.email,
      hasPhone: !!primaryContact.phone
    })
    
    if (primaryContact.contactId) {
      primaryContactEmail = primaryContact.email
      primaryContactPhone = primaryContact.phone
      primaryContactId = primaryContact.contactId
      console.log('✅ SUCCESS: Primary Contact pulled via Contact Roles!', {
        method: 'Contact Roles API',
        contactId: primaryContactId,
        email: primaryContactEmail,
        phone: primaryContactPhone,
        emailValid: !!primaryContactEmail && primaryContactEmail.includes('@'),
        phoneValid: !!primaryContactPhone
      })
    } else {
      console.log('❌ FAILED: No Primary Contact found via Contact Roles')
      console.log('⚠️  Will try fallback methods...')
    }  } catch (contactRoleError) {
    console.warn('❌ Contact Roles method failed:', contactRoleError)
    console.log('📝 Contact Roles Error Details:', {
      errorType: contactRoleError instanceof Error ? contactRoleError.constructor.name : typeof contactRoleError,
      errorMessage: contactRoleError instanceof Error ? contactRoleError.message : String(contactRoleError),
      dealId: dealId
    })
  }

  // Fallback methods if Contact Roles didn't work
  if (!primaryContactId) {
    console.log('🔄 Contact Roles did not return a primary contact, trying fallback methods...')
    const fallbackContact = await tryFallbackContactMethods(dealData)
    primaryContactEmail = fallbackContact.email
    primaryContactPhone = fallbackContact.phone
    primaryContactId = fallbackContact.id
    
    if (primaryContactId) {
      console.log('✅ SUCCESS: Primary Contact pulled via fallback method!', {
        method: 'Fallback Methods',
        contactId: primaryContactId,
        email: primaryContactEmail,
        phone: primaryContactPhone,
        emailValid: !!primaryContactEmail && primaryContactEmail.includes('@'),
        phoneValid: !!primaryContactPhone
      })
    } else {
      console.log('❌ FAILED: No Primary Contact found via any method')
      console.log('⚠️  Will proceed with empty contact information')
    }
  }
  // Validate email format
  const isEmailValid = validateEmailFormat(primaryContactEmail)
  const validatedEmail = isEmailValid ? primaryContactEmail : ''
  
  console.log('📋 Final Contact Validation Result:', { 
    originalEmail: primaryContactEmail, 
    validatedEmail, 
    isEmailValid: isEmailValid,
    contactId: primaryContactId,
    phone: primaryContactPhone,
    hasPrimaryContact: !!primaryContactId,
    hasValidEmail: !!validatedEmail,
    hasPhone: !!primaryContactPhone
  })

  // Final success/failure summary
  if (primaryContactId) {
    console.log('🎉 CONTACT RESOLUTION SUCCESS!')
    console.log('📊 Contact Summary:', {
      source: primaryContactId ? 'Found via API' : 'Not found',
      contactId: primaryContactId,
      emailStatus: validatedEmail ? 'Valid' : (primaryContactEmail ? 'Invalid format' : 'Not provided'),
      phoneStatus: primaryContactPhone ? 'Provided' : 'Not provided'
    })
  } else {
    console.log('⚠️  CONTACT RESOLUTION WARNING: No primary contact found')
    console.log('💡 PM Request will be created without contact information')
  }

  return {
    id: primaryContactId,
    email: validatedEmail,
    phone: primaryContactPhone,
    isValid: isEmailValid
  }
}

/**
 * Tries fallback methods to find contact information
 */
async function tryFallbackContactMethods(dealData: ZohoDealRecord): Promise<ContactInfo> {
  console.log('🔄 Trying fallback contact finding methods...')
  
  let email = ''
  let phone = ''
  let id: string | null = null
  try {
    // Method 2: Direct contact reference in deal
    console.log('🔍 Trying Method 2: Direct contact reference in deal...')
    const directContact = await tryDirectContactFromDeal(dealData)
    if (directContact.id) {
      console.log('✅ SUCCESS: Primary Contact pulled via direct deal reference!', {
        method: 'Direct Deal Reference',
        contactId: directContact.id,
        email: directContact.email,
        phone: directContact.phone,
        emailValid: directContact.isValid
      })
      return directContact
    } else {
      console.log('❌ No contact found via direct deal reference')
    }

    // Method 3: Account primary contact
    console.log('🔍 Trying Method 3: Account primary contact...')
    const accountContact = await tryAccountPrimaryContact(dealData)
    if (accountContact.id) {
      console.log('✅ SUCCESS: Primary Contact pulled via account primary contact!', {
        method: 'Account Primary Contact',
        contactId: accountContact.id,
        email: accountContact.email,
        phone: accountContact.phone,
        emailValid: accountContact.isValid
      })
      return accountContact
    } else {
      console.log('❌ No contact found via account primary contact')
    }

    console.log('⚠️  No primary contact found using any fallback method, using empty values')
    
  } catch (contactError) {
    console.warn('❌ Could not fetch contact information:', contactError)
  }

  return { id, email, phone, isValid: false }
}

/**
 * Tries to get contact from direct deal reference
 */
async function tryDirectContactFromDeal(dealData: ZohoDealRecord): Promise<ContactInfo> {
  if (dealData.Contact_Name && 
      typeof dealData.Contact_Name === 'object' && 
      'id' in dealData.Contact_Name && 
      dealData.Contact_Name.id) {
    
    console.log('🔍 Found contact reference in deal, fetching contact details...')
    const contactResponse = await fetchContactData((dealData.Contact_Name as { id: string }).id)
    
    if (contactResponse.data && contactResponse.data.length > 0) {
      const contact = contactResponse.data[0] as ZohoContact
      const email = contact.Email || ''
      const phone = contact.Phone || ''
      const id = (dealData.Contact_Name as { id: string }).id
      
      console.log('✅ Contact found via deal reference:', { email, phone })
      return {
        id,
        email,
        phone,
        isValid: validateEmailFormat(email)
      }
    }
  }
  
  return { id: null, email: '', phone: '', isValid: false }
}

/**
 * Tries to get contact from account's primary contact
 */
async function tryAccountPrimaryContact(dealData: ZohoDealRecord): Promise<ContactInfo> {
  if (dealData.Account_Name && 
      typeof dealData.Account_Name === 'object' && 
      'id' in dealData.Account_Name && 
      dealData.Account_Name.id) {
    
    console.log('🔍 No direct contact found, trying to get account primary contact...')
    const accountResponse = await fetchAccountData((dealData.Account_Name as { id: string }).id)
    
    if (accountResponse.data && accountResponse.data.length > 0) {
      const account = accountResponse.data[0] as Record<string, unknown>
      
      if (account.Primary_Contact && 
          typeof account.Primary_Contact === 'object' && 
          account.Primary_Contact !== null &&
          'id' in account.Primary_Contact &&
          (account.Primary_Contact as { id: string }).id) {
        
        const contactResponse = await fetchContactData((account.Primary_Contact as { id: string }).id)
        
        if (contactResponse.data && contactResponse.data.length > 0) {
          const contact = contactResponse.data[0] as ZohoContact
          const email = contact.Email || ''
          const phone = contact.Phone || ''
          const id = (account.Primary_Contact as { id: string }).id
          
          console.log('✅ Contact found via account primary contact:', { email, phone })
          return {
            id,
            email,
            phone,
            isValid: validateEmailFormat(email)
          }
        }
      }
    }
  }
  
  return { id: null, email: '', phone: '', isValid: false }
}

/**
 * Validates email format
 */
function validateEmailFormat(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
