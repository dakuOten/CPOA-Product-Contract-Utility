// Zoho CRM API response types and interfaces

export interface ZohoApiResponse {
  data: unknown[]
  status: string
  message?: string
}

export interface ZohoUpdateResponse {
  data: Array<{
    code: string
    details: {
      Modified_Time: string
      Modified_By: {
        name: string
        id: string
      }
      Change_Owner: string
      id: string
      Created_Time: string
    }
    message: string
    status: string
  }>
}

export interface ZohoDealRecord extends Record<string, unknown> {
  id: string
  Account_Name?: { id: string; name?: string } | string
  Contact_Name?: { id: string; name?: string } | string
  Description?: string
  Curent_Services?: string
  Account_Number?: string
  Circuit_Id?: string
  Street?: string
  City?: string
  State?: string
  Zip_Code1?: string
  Service_Street?: string
  Service_City?: string
  Service_State?: string
  Service_Zip_Code?: string
  Porting_Moving_TNs?: boolean
  Data_Interface_Type?: string
  Contract_ID_ADIVB_Number?: string
  Sub_Account_ID?: string
  Subform_1?: import('../../types/zoho').ZohoProductSubform[]
}

export interface ZohoContact extends Record<string, unknown> {
  id: string
  Email?: string
  Phone?: string
}

export interface ZohoContactRole {
  id: string
  Contact_Role: {
    name: string
    id: string
  }
  Email?: string
  Contact?: {
    id: string
    name: string
    Email?: string
  }
}

export interface ZohoConnectionResponse {
  code?: string
  status?: string
  message?: string
  details?: {
    status?: string
    statusMessage?: {
      data?: ZohoContactRole[]
      info?: {
        per_page: number
        count: number
        page: number
        next_page_token?: string | null
        previous_page_token?: string | null
      }
    }
  }
}

export interface ZohoExtendedWindow {
  ZOHO?: {
    CRM?: {
      API?: {
        getRecord?: (config: Record<string, unknown>) => Promise<unknown>
        updateRecord?: (config: Record<string, unknown>) => Promise<unknown>
        insertRecord?: (config: Record<string, unknown>) => Promise<unknown>
        searchRecords?: (config: Record<string, unknown>) => Promise<unknown>
      }
      CONNECTION?: {
        invoke?: (connectionName: string, options: Record<string, unknown>) => Promise<unknown>
      }
      UI?: Record<string, unknown>
      CONFIG?: Record<string, unknown>
    }
    embeddedApp?: Record<string, unknown>
  }
}

export interface ZohoAccountRecord extends Record<string, unknown> {
  id: string
  Primary_Contact?: {
    id: string
    name?: string
  }
}

export interface PMRequestData extends Record<string, unknown> {
  Request_Type: string
  Deals: string
  Company_Name: string
  Billing_Address: string
  Service_Address: string
  Contact_Person: string | null
  Email: string
  Phone: string
  Request_Descriptions: string
  Requested_Services: string
  Current_Account_Number: string
  New_Circuit_ID: string
  Assigned_PM: string
  Product_Type: string
  Requested_Term: string
  Requested_Data_Hand_Off: string
  Circuit_ID: string
  Current_MRC: number
  Are_we_Moving_TNs: boolean
  Contract_ID_Number_ADIVB_Number: string
  Sub_Account_ID: string
}
