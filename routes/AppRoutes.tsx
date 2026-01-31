import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout Component
import MainLayout from '../components/layout/MainLayout';

// Lazy-loaded Page Components (Code Splitting)
import {
    LazyDashboardPage as DashboardPage,
    LazyContractListPage as ContractListPage,
    LazyContractDetailPage as ContractDetailPage,
    LazyContractFormPage as ContractFormPage,
    LazyPaymentListPage as PaymentListPage,
    LazyAnalyticsPage as AnalyticsPage,
    LazyAIAssistantPage as AIAssistantPage,
    LazyPersonnelListPage as PersonnelListPage,
    LazyPersonnelDetailPage as PersonnelDetailPage,
    LazyCustomerListPage as CustomerListPage,
    LazyCustomerDetailPage as CustomerDetailPage,
    LazyProductListPage as ProductListPage,
    LazyProductDetailPage as ProductDetailPage,
    LazyUnitListPage as UnitListPage,
    LazyUnitDetailPage as UnitDetailPage,
    LazySettingsPage as SettingsPage,
} from '../components/LazyPages';

// Route Configuration
export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            // Dashboard - Home
            { index: true, element: <DashboardPage /> },
            { path: 'dashboard', element: <Navigate to="/" replace /> },

            // Contracts
            { path: 'contracts', element: <ContractListPage /> },
            { path: 'contracts/new', element: <ContractFormPage /> },
            { path: 'contracts/:id', element: <ContractDetailPage /> },
            { path: 'contracts/:id/edit', element: <ContractFormPage /> },

            // Payments
            { path: 'payments', element: <PaymentListPage /> },

            // Analytics
            { path: 'analytics', element: <AnalyticsPage /> },

            // AI Assistant
            { path: 'ai-assistant', element: <AIAssistantPage /> },

            // Personnel
            { path: 'personnel', element: <PersonnelListPage /> },
            { path: 'personnel/:id', element: <PersonnelDetailPage /> },

            // Customers
            { path: 'customers', element: <CustomerListPage /> },
            { path: 'customers/:id', element: <CustomerDetailPage /> },

            // Products
            { path: 'products', element: <ProductListPage /> },
            { path: 'products/:id', element: <ProductDetailPage /> },

            // Units
            { path: 'units', element: <UnitListPage /> },
            { path: 'units/:id', element: <UnitDetailPage /> },

            // Settings
            { path: 'settings', element: <SettingsPage /> },

            // 404 Fallback
            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
]);

// Route helpers for navigation
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
    SETTINGS: '/settings',
} as const;
