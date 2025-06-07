// Zoho CRM Types for Contract Product functionality

export interface ZohoUser {
  name: string
  id: string
}

export interface ZohoAccount {
  name: string
  id: string
}

export interface ZohoProduct {
  name: string
  id: string
}

export interface ZohoProductSubform {
  Is_Contract: boolean
  Main_Product: boolean
  Products: ZohoProduct
  Product_Type: string
  Quantity: number
  Terms: string
  Pricing: number
  Total_Pricing: string
  Vendor: string | null
  Product_Grouping?: string
}

export interface ZohoDealData {
  id: string
  Circuit_Id: string
  Contract_ID_ADIVB_Number: string | null
  MCN: string | null
  Contract_Product: boolean
  Counter_Signed_Date: string
  Created_By: ZohoUser
  Owner: ZohoUser
  Amount: number
  Lead_Type: string | null
  Deal_Focus: string | null
  Service_City: string
  Internet_Provider_and_Speed_Free_Field: string | null
  Previous_Deal_Disconnect: string
  MAC_P: string
  Wireless_Carrier_and_Number_of_Lines_Free_Field: string | null
  Phone_Provider_and_Number_of_Lines_Free_Field: string | null
  PM_Request_Id: string
  Service_State: string
  Service_Zip_Code: string
  Email_Marketing_Status: string | null
  Timezone: string | null
  Modified_By: ZohoUser
  Project_Completed_Date: string | null
  Deal_Name: string
  Order_Handoff_Date: string
  Deal_Department: string
  Layout_Name: string
  Sales_Traction: string | null
  Contract_Signed_Date: string
  Partner_Vendor_2: ZohoUser
  Project_Completed: string | null
  Reason_for_Closed_Lost1: string | null
  Partner_Vendor_1: ZohoUser
  Lead_Source: string | null
  Is_Disconnected: boolean
  zohoworkdriveforcrm__Workdrive_Folder_URL: string | null
  Currency: string
  Total_Wireline: string
  Managed: string | null
  Voice_Handoff: string | null
  Closing_Date: string
  Data_Interface_Type: string | null
  Curent_Services: string
  Description: string
  Phone_System_Make_Model: string | null
  Account_Name: ZohoAccount
  Locked: boolean
  With_Call_Paths: string | null
  Exchange_Rate: string
  Service_Street: string
  Street: string
  City: string
  State: string
  Porting_Moving_TNs: boolean
  Sub_Account_ID: string | null
  Validated_By: string | null
  Stage: string
  Zip_Code1: string
  Account_Number: string
  Product_Type: string | null
  Layout: string
  Campaign: string | null
  Probability: number
  Order_Validation_Link: string | null
  Processed_By: string | null
  Deal_Type: string | null
  Testing_trigger: boolean
  Forecast_Category__s: string
  Developer_Space: boolean
  Federal_Tax_ID: string
  Subform_1: ZohoProductSubform[]
}

export interface ZohoPageLoadData {
  data: ZohoDealData
}

// Zoho SDK global interface
declare global {
  interface Window {
    ZOHO?: {
      CRM?: {
        CONFIG?: {
          getCurrentUser?: () => Promise<unknown>
        }
        API?: {
          getRecord: (config: Record<string, unknown>) => Promise<unknown>
          updateRecord: (config: Record<string, unknown>) => Promise<unknown>
          insertRecord: (config: Record<string, unknown>) => Promise<unknown>
        }
        UI?: {
          Popup?: {
            close?: () => void
            closeReload?: () => void
          }
          Record?: {
            refresh?: () => void
          }
        }
      }
      embeddedApp?: {
        on: (event: string, callback: (data: ZohoPageLoadData) => void) => void
        init: () => void
      }
    }
  }

  // $Client API for widget communication
  const $Client: {
    close: (options?: { exit?: boolean }) => void
    on: (event: string, callback: (data: unknown) => void) => void
    trigger: (event: string, data?: unknown) => void
  }
}

export {}
