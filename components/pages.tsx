// Page wrapper components that bridge react-router-dom to existing components
// These wrappers get context from MainLayout and pass as props to existing components

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayoutContext } from './layout/MainLayout';
import { ROUTES } from '../routes/routes';

// Dashboard
import DashboardComponent from './Dashboard';
export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedUnit, setSelectedUnit } = useLayoutContext();
    return (
        <DashboardComponent
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            onSelectContract={(id) => navigate(ROUTES.CONTRACT_DETAIL(id))}
        />
    );
};

// Contract List
import ContractListComponent from './ContractList';
export const ContractListPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedUnit } = useLayoutContext();
    return (
        <ContractListComponent
            selectedUnit={selectedUnit}
            onSelectContract={(id) => {
                const encodedId = encodeURIComponent(id);
                navigate(ROUTES.CONTRACT_DETAIL(encodedId));
            }}
            onAdd={() => navigate(ROUTES.CONTRACT_NEW)}
            onClone={(contract) => navigate(ROUTES.CONTRACT_NEW, { state: { cloneFrom: contract } })}
        />
    );
};


// Contract Detail
import ContractDetailComponent from './ContractDetail';
export const ContractDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: rawId } = useParams<{ id: string }>();
    // Decode URL-encoded ID (handles special chars like / in contract IDs)
    const id = rawId ? decodeURIComponent(rawId) : undefined;
    if (!id) return <div>Contract not found</div>;
    return (
        <ContractDetailComponent
            contractId={id}
            onBack={() => navigate(ROUTES.CONTRACTS)}
            onEdit={() => navigate(ROUTES.CONTRACT_EDIT(encodeURIComponent(id)))}
            onDelete={async () => {
                // Handle delete then navigate
                navigate(ROUTES.CONTRACTS);
            }}
        />
    );
};


// Contract Form
import ContractFormComponent from './ContractForm';
import { useLocation } from 'react-router-dom';
import { ContractService } from '../services';
import { toast } from 'sonner';
export const ContractFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: rawId } = useParams<{ id: string }>();
    const id = rawId ? decodeURIComponent(rawId) : undefined;
    const location = useLocation();
    const cloneFrom = location.state?.cloneFrom;

    // For edit mode, we'd need to fetch the contract
    // For now, handle create and clone
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <ContractFormComponent
                contract={cloneFrom}
                isCloning={!!cloneFrom}
                onSave={async (data) => {
                    try {
                        if (id) {
                            await ContractService.update(id, data);
                            toast.success("Cập nhật hợp đồng thành công!");
                        } else {
                            await ContractService.create(data);
                            toast.success(cloneFrom ? "Nhân bản hợp đồng thành công!" : "Tạo hợp đồng thành công!");
                        }
                        navigate(ROUTES.CONTRACTS);
                    } catch (e: any) {
                        toast.error("Lỗi: " + (e.message || e));
                    }
                }}
                onCancel={() => navigate(-1)}
            />
        </div>
    );
};

// Payment List
import PaymentListComponent from './PaymentList';
export const PaymentListPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <PaymentListComponent
            onSelectContract={(id) => navigate(ROUTES.CONTRACT_DETAIL(id))}
        />
    );
};

// Analytics
import AnalyticsComponent from './Analytics';
export const AnalyticsPage: React.FC = () => {
    const { selectedUnit, setSelectedUnit } = useLayoutContext();
    return (
        <AnalyticsComponent
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
        />
    );
};

// AI Assistant
import AIAssistantComponent from './AIAssistant';
export const AIAssistantPage: React.FC = () => {
    return <AIAssistantComponent />;
};

// Personnel List
import PersonnelListComponent from './PersonnelList';
export const PersonnelListPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedUnit } = useLayoutContext();
    return (
        <PersonnelListComponent
            selectedUnit={selectedUnit}
            onSelectPersonnel={(id) => navigate(ROUTES.PERSONNEL_DETAIL(id))}
        />
    );
};

// Personnel Detail
import PersonnelDetailComponent from './PersonnelDetail';
export const PersonnelDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Personnel not found</div>;
    return (
        <PersonnelDetailComponent
            personnelId={id}
            onBack={() => navigate(ROUTES.PERSONNEL)}
            onViewContract={(contractId) => navigate(ROUTES.CONTRACT_DETAIL(contractId))}
        />
    );
};

// Customer List
import CustomerListComponent from './CustomerList';
export const CustomerListPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <CustomerListComponent
            onSelectCustomer={(id) => navigate(ROUTES.CUSTOMER_DETAIL(id))}
        />
    );
};

// Customer Detail
import CustomerDetailComponent from './CustomerDetail';
export const CustomerDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Customer not found</div>;
    return (
        <CustomerDetailComponent
            customerId={id}
            onBack={() => navigate(ROUTES.CUSTOMERS)}
            onViewContract={(contractId) => navigate(ROUTES.CONTRACT_DETAIL(contractId))}
        />
    );
};

// Product List
import ProductListComponent from './ProductList';
export const ProductListPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <ProductListComponent
            onSelectProduct={(id) => navigate(ROUTES.PRODUCT_DETAIL(id))}
        />
    );
};

// Product Detail
import ProductDetailComponent from './ProductDetail';
export const ProductDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Product not found</div>;
    return (
        <ProductDetailComponent
            productId={id}
            onBack={() => navigate(ROUTES.PRODUCTS)}
            onEdit={() => {/* TODO: implement edit modal */ }}
            onViewContract={(contractId) => navigate(ROUTES.CONTRACT_DETAIL(contractId))}
        />
    );
};

// Unit List
import UnitListComponent from './UnitList';
export const UnitListPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <UnitListComponent
            onSelectUnit={(id) => navigate(ROUTES.UNIT_DETAIL(id))}
        />
    );
};

// Unit Detail
import UnitDetailComponent from './UnitDetail';
export const UnitDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Unit not found</div>;
    return (
        <UnitDetailComponent
            unitId={id}
            onBack={() => navigate(ROUTES.UNITS)}
            onViewContract={(contractId) => navigate(ROUTES.CONTRACT_DETAIL(contractId))}
            onViewPersonnel={(personnelId) => navigate(ROUTES.PERSONNEL_DETAIL(personnelId))}
        />
    );
};

// Settings - uses context directly
import SettingsComponent from './Settings';
export const SettingsPage: React.FC = () => {
    return <SettingsComponent />;
};
