/**
 * Contact Roles API Test Script
 * Use this in the browser console to test the Contact Roles implementation
 */

// Test function to verify Contact Roles API implementation
async function testContactRolesAPI() {
  console.log('=== TESTING CONTACT ROLES API IMPLEMENTATION ===')
  
  // Check if Zoho API is available
  if (!window.ZOHO?.CRM) {
    console.error('❌ Zoho CRM API not available')
    return
  }
  
  console.log('✅ Zoho CRM API available')
  
  // Check if CONNECTION API is available
  if (!window.ZOHO.CRM.CONNECTION) {
    console.error('❌ Zoho CRM CONNECTION API not available')
    return
  }
  
  console.log('✅ Zoho CRM CONNECTION API available')
  
  // Test with a sample deal ID (replace with actual deal ID)
  const TEST_DEAL_ID = 'YOUR_DEAL_ID_HERE' // Replace with actual deal ID
  
  try {
    // Import the Contact Roles function
    const { findDealPrimaryContact } = await import('./src/utils/zoho/dealOperations.js')
    
    console.log('✅ Contact Roles function imported successfully')
    
    // Test the function
    console.log(`🔍 Testing with Deal ID: ${TEST_DEAL_ID}`)
    const result = await findDealPrimaryContact(TEST_DEAL_ID)
    
    console.log('📋 Contact Roles API Test Result:', result)
    
    if (result.contactId) {
      console.log('✅ PRIMARY CONTACT FOUND:')
      console.log(`   Contact ID: ${result.contactId}`)
      console.log(`   Email: ${result.email}`)
      console.log(`   Phone: ${result.phone}`)
    } else {
      console.log('⚠️  No primary contact found - this could be expected if:')
      console.log('   - Deal has no Contact Roles defined')
      console.log('   - Deal has no direct contact reference')
      console.log('   - Associated account has no primary contact')
    }
    
  } catch (error) {
    console.error('❌ Error testing Contact Roles API:', error)
  }
  
  console.log('=== CONTACT ROLES API TEST COMPLETE ===')
}

// Manual test of raw CONNECTION API
async function testRawConnectionAPI() {
  console.log('=== TESTING RAW CONNECTION API ===')
  
  const TEST_DEAL_ID = 'YOUR_DEAL_ID_HERE' // Replace with actual deal ID
  
  try {
    const response = await window.ZOHO.CRM.CONNECTION.invoke("crm_con", {
      method: "GET",
      url: `https://www.zohoapis.com/crm/v8/Deals/${TEST_DEAL_ID}/Contact_Roles?fields=Email,Department`,
      param_type: 1
    })
    
    console.log('✅ Raw CONNECTION API Response:', response)
    
    if (response.status_code === 200 && response.response?.data) {
      console.log('📋 Contact Roles Found:', response.response.data)
      
      response.response.data.forEach((role, index) => {
        console.log(`   Contact Role ${index + 1}:`)
        console.log(`     Role: ${role.Role}`)
        console.log(`     Contact ID: ${role.Contact?.id}`)
        console.log(`     Contact Name: ${role.Contact?.name}`)
        console.log(`     Email: ${role.Email || role.Contact?.Email || 'N/A'}`)
        console.log(`     Department: ${role.Department || 'N/A'}`)
      })
    } else {
      console.log('⚠️  No Contact Roles found or API call failed')
    }
    
  } catch (error) {
    console.error('❌ Raw CONNECTION API Error:', error)
  }
  
  console.log('=== RAW CONNECTION API TEST COMPLETE ===')
}

// Instructions
console.log(`
🧪 CONTACT ROLES API TESTING

To test the Contact Roles implementation:

1. Replace 'YOUR_DEAL_ID_HERE' with an actual Deal ID from your Zoho CRM
2. Run: testContactRolesAPI()
3. For raw API testing, run: testRawConnectionAPI()

Example:
const TEST_DEAL_ID = '1234567890123456789'
testContactRolesAPI()
`)

// Export for use
window.testContactRolesAPI = testContactRolesAPI
window.testRawConnectionAPI = testRawConnectionAPI
