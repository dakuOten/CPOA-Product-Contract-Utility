import type { ZohoApiResponse, ZohoConnectionResponse, ZohoContactRole, ZohoDealRecord, ZohoContact, ZohoExtendedWindow, ZohoAccountRecord } from './types'
import { zohoApiCall, validateZohoAPI } from './core'

/**
 * Fetches deal data from Zoho CRM
 * @param dealId - The Zoho Deal ID
 * @returns Promise with deal data
 */
export async function fetchDealData(dealId: string): Promise<ZohoApiResponse> {
  console.log('=== FETCHING DEAL DATA ===')
  console.log('Deal ID:', dealId)

  validateZohoAPI()
  
  try {
    const response = await zohoApiCall<ZohoApiResponse>(async () => {
      return new Promise<ZohoApiResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.getRecord({
          Entity: "Deals",
          RecordID: dealId
        })
        .then((response: unknown) => {
          console.log('Deal Data Response:', response)
          resolve(response as ZohoApiResponse)
        })
        .catch((error: unknown) => {
          console.error('Error fetching deal data:', error)
          reject(error)
        })
      })
    })

    console.log('=== DEAL DATA FETCHED SUCCESSFULLY ===')
    return response
  } catch (error) {
    console.error('=== DEAL DATA FETCH ERROR ===')
    console.error('Error fetching deal data:', error)
    console.error('Deal ID:', dealId)
    console.error('============================')
    
    throw new Error(
      `Failed to fetch deal data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Fetches contact data from Zoho CRM
 * @param contactId - The Zoho Contact ID
 * @returns Promise with contact data
 */
export async function fetchContactData(contactId: string): Promise<ZohoApiResponse> {
  console.log('=== FETCHING CONTACT DATA ===')
  console.log('Contact ID:', contactId)

  validateZohoAPI()
  
  try {
    const response = await zohoApiCall<ZohoApiResponse>(async () => {
      return new Promise<ZohoApiResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.getRecord({
          Entity: "Contacts",
          RecordID: contactId
        })
        .then((response: unknown) => {
          console.log('Contact Data Response:', response)
          resolve(response as ZohoApiResponse)
        })
        .catch((error: unknown) => {
          console.error('Error fetching contact data:', error)
          reject(error)
        })
      })
    })

    console.log('=== CONTACT DATA FETCHED SUCCESSFULLY ===')
    return response
  } catch (error) {
    console.error('=== CONTACT DATA FETCH ERROR ===')
    console.error('Error fetching contact data:', error)
    console.error('Contact ID:', contactId)
    console.error('===============================')
    
    throw new Error(
      `Failed to fetch contact data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Fetches account data from Zoho CRM
 * @param accountId - The Zoho Account ID
 * @returns Promise with account data
 */
export async function fetchAccountData(accountId: string): Promise<ZohoApiResponse> {
  console.log('=== FETCHING ACCOUNT DATA ===')
  console.log('Account ID:', accountId)

  validateZohoAPI()
  
  try {
    const response = await zohoApiCall<ZohoApiResponse>(async () => {
      return new Promise<ZohoApiResponse>((resolve, reject) => {
        window.ZOHO!.CRM!.API!.getRecord({
          Entity: "Accounts",
          RecordID: accountId
        })
        .then((response: unknown) => {
          console.log('Account Data Response:', response)
          resolve(response as ZohoApiResponse)
        })
        .catch((error: unknown) => {
          console.error('Error fetching account data:', error)
          reject(error)
        })
      })
    })

    console.log('=== ACCOUNT DATA FETCHED SUCCESSFULLY ===')
    return response
  } catch (error) {
    console.error('=== ACCOUNT DATA FETCH ERROR ===')
    console.error('Error fetching account data:', error)
    console.error('Account ID:', accountId)
    console.error('==============================')
    
    throw new Error(
      `Failed to fetch account data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Finds the Primary Contact for a deal using Contact Roles API
 * Uses ZOHO.CRM.CONNECTION.invoke for proper Contact Roles access
 * @param dealId - The Zoho Deal ID
 * @returns Promise with primary contact information
 */
export async function findDealPrimaryContact(dealId: string): Promise<{
  contactId: string | null
  email: string
  phone: string
}> {
  console.log('=== FINDING DEAL PRIMARY CONTACT ===')
  console.log('Deal ID:', dealId)

  validateZohoAPI()

  try {
    // Method 1: Use CONNECTION.invoke to fetch Contact Roles
    console.log('Attempting to fetch Contact Roles via CONNECTION.invoke...')
    
    const contactRolesResponse = await zohoApiCall<ZohoConnectionResponse>(async () => {      return new Promise<ZohoConnectionResponse>((resolve, reject) => {
        const extendedWindow = window as unknown as ZohoExtendedWindow
        if (!extendedWindow.ZOHO?.CRM?.CONNECTION) {
          reject(new Error('ZOHO.CRM.CONNECTION not available'))
          return
        }

        extendedWindow.ZOHO.CRM.CONNECTION.invoke!("crm_conn", {
          method: "GET",
          url: `https://www.zohoapis.com/crm/v8/Deals/${dealId}/Contact_Roles?fields=Email,Department`,
          param_type: 1
        })        .then((response: unknown) => {
          console.log('Contact Roles API Response:', response)
          resolve(response as ZohoConnectionResponse)
        })
        .catch((error: unknown) => {
          console.log('Contact Roles API failed:', error)
          reject(error)
        })
      })
    })

    console.log('Contact Roles found:', contactRolesResponse?.details?.statusMessage?.data)
    
    // Process Contact Roles response
    if (contactRolesResponse?.code === 'SUCCESS' && 
        contactRolesResponse?.status === 'success' &&
        contactRolesResponse?.details?.statusMessage?.data && 
        Array.isArray(contactRolesResponse.details.statusMessage.data) && 
        contactRolesResponse.details.statusMessage.data.length > 0) {
      
      console.log('Contact Roles found:', contactRolesResponse.details.statusMessage.data)
      
      // Look for Primary Contact or Decision Maker first
      let primaryContactRole = contactRolesResponse.details.statusMessage.data.find((role: ZohoContactRole) => 
        role.Contact_Role?.name === 'Primary Contact' || 
        role.Contact_Role?.name === 'Decision Maker' ||
        role.Contact_Role?.name === 'Primary' ||
        role.Contact_Role?.name === 'Main Contact'
      )
        // If no specific primary contact found, use the first contact role
      if (!primaryContactRole && contactRolesResponse.details.statusMessage.data.length > 0) {
        primaryContactRole = contactRolesResponse.details.statusMessage.data[0]
        console.log('No specific primary contact found, using first contact role:', primaryContactRole)
      }

      if (primaryContactRole) {
        console.log('Found primary contact via Contact Roles:', primaryContactRole)
          // Extract contact ID from the contact role record
        // Based on the API response, the contact ID might be the main 'id' field
        const contactId = primaryContactRole.id
        let email = primaryContactRole.Email || ''
        let phone = ''
        
        console.log('Extracted contact ID:', contactId)
        console.log('Extracted email from Contact Role:', email)
        
        // If we have a contact ID but need more details, fetch the full contact record
        if (contactId && (!email || !phone)) {
          try {
            console.log('Fetching full contact details for ID:', contactId)
            const contactResponse = await fetchContactData(contactId)
            if (contactResponse.data && contactResponse.data.length > 0) {
              const contact = contactResponse.data[0] as ZohoContact
              console.log('Fetched additional contact details:', contact)
              
              email = email || contact.Email || ''
              phone = contact.Phone || ''
            }
          } catch (contactError) {
            console.warn('Failed to fetch additional contact details:', contactError)
          }
        }
        
        console.log('Final contact details:', { contactId, email, phone })
        
        return {
          contactId: contactId || null,
          email: email,
          phone: phone
        }
      }
    }

    console.log('Contact Roles method did not return results, trying fallback approach...')

    // Method 2: Fallback - Try to get contact from deal record directly
    console.log('Attempting to get contact from deal record...')
    
    const dealResponse = await fetchDealData(dealId)
    if (dealResponse.data && dealResponse.data.length > 0) {
      const deal = dealResponse.data[0] as ZohoDealRecord
      console.log('Deal data for contact lookup:', deal)
      
      // Check if deal has a direct contact reference
      if (deal.Contact_Name && typeof deal.Contact_Name === 'object' && deal.Contact_Name.id) {
        console.log('Found contact reference in deal:', deal.Contact_Name)
        
        try {
          const contactResponse = await fetchContactData(deal.Contact_Name.id)
          if (contactResponse.data && contactResponse.data.length > 0) {
            const contact = contactResponse.data[0] as ZohoContact
            console.log('Fetched contact from deal reference:', contact)
            
            return {
              contactId: deal.Contact_Name.id,
              email: contact.Email || '',
              phone: contact.Phone || ''
            }
          }
        } catch (contactError) {
          console.warn('Failed to fetch contact from deal reference:', contactError)
        }
      }
      
      // Method 3: Final fallback - Try to get primary contact from account
      if (deal.Account_Name && typeof deal.Account_Name === 'object' && deal.Account_Name.id) {
        console.log('Attempting to get primary contact from account...')
        
        try {
          const accountResponse = await fetchAccountData(deal.Account_Name.id)
          if (accountResponse.data && accountResponse.data.length > 0) {
            const account = accountResponse.data[0] as ZohoAccountRecord
            console.log('Account data for contact lookup:', account)
            
            // Many CRM systems have a primary contact field on accounts
            if (account.Primary_Contact && account.Primary_Contact.id) {
              const contactResponse = await fetchContactData(account.Primary_Contact.id)
              
              if (contactResponse.data && contactResponse.data.length > 0) {
                const contact = contactResponse.data[0] as ZohoContact
                console.log('Fetched primary contact from account:', contact)
                
                return {
                  contactId: account.Primary_Contact.id,
                  email: contact.Email || '',
                  phone: contact.Phone || ''
                }
              }
            }
          }
        } catch (accountError) {
          console.warn('Failed to fetch account data:', accountError)
        }
      }
    }

    console.log('All methods failed to find primary contact, returning empty result')
    return {
      contactId: null,
      email: '',
      phone: ''
    }

  } catch (error) {
    console.error('Error finding primary contact:', error)
    
    return {
      contactId: null,
      email: '',
      phone: ''
    }
  }
}
