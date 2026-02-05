// Route path constants - separated to avoid circular dependencies

export const ROUTES = {
    DASHBOARD: '/',
    CONTRACTS: '/contracts',
    CONTRACT_NEW: '/contracts/new',
    CONTRACT_DETAIL: (id: string) => `/contracts/${id}`,
    CONTRACT_EDIT: (id: string) => `/contracts/${id}/edit`,
    PAYMENTS: '/payments',
    ANALYTICS: '/analytics',
    AI_ASSISTANT: '/ai-assistant',
    PERSONNEL: '/personnel',
    PERSONNEL_DETAIL: (id: string) => `/personnel/${id}`,
    CUSTOMERS: '/customers',
    CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,
    PRODUCTS: '/products',
    PRODUCT_DETAIL: (id: string) => `/products/${id}`,
    UNITS: '/units',
    UNIT_DETAIL: (id: string) => `/units/${id}`,
    USER_GUIDE: '/user-guide',
    SETTINGS: '/settings',
} as const;
