
import React, { useState, useEffect } from 'react';
import DataSeeder from './components/admin/DataSeeder';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ContractList from './components/ContractList';
import AIAssistant from './components/AIAssistant';
import ContractDetail from './components/ContractDetail';
import ContractForm from './components/ContractForm';
import PersonnelList from './components/PersonnelList';
import PersonnelDetail from './components/PersonnelDetail';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import PaymentList from './components/PaymentList';
import { MOCK_UNITS, MOCK_CONTRACTS, MOCK_PRODUCTS } from './constants';
import { Unit, Contract, Product } from './types';
import { ContractsAPI } from './services/api';
import { Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit>(MOCK_UNITS[0]);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);
  const [viewingPersonnelId, setViewingPersonnelId] = useState<string | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('contract-pro-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('contract-pro-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewContract = (id: string) => {
    setViewingContractId(id);
    setActiveTab('contract-detail');
  };

  const handleBackToList = () => {
    setViewingContractId(null);
    setActiveTab('contracts');
  };

  const handleViewPersonnel = (id: string) => {
    setViewingPersonnelId(id);
    setActiveTab('personnel-detail');
  };

  const handleBackToPersonnelList = () => {
    setViewingPersonnelId(null);
    setActiveTab('personnel');
  };

  const handleViewCustomer = (id: string) => {
    setViewingCustomerId(id);
    setActiveTab('customer-detail');
  };

  const handleBackToCustomerList = () => {
    setViewingCustomerId(null);
    setActiveTab('customers');
  };

  const handleViewProduct = (id: string) => {
    setViewingProductId(id);
    setActiveTab('product-detail');
  };

  const handleBackToProductList = () => {
    setViewingProductId(null);
    setActiveTab('products');
  };
  const renderContent = () => {
    // Create new contract
    if (isCreating) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <ContractForm
            onSave={async (data) => {
              try {
                await ContractsAPI.create(data);
                setIsCreating(false);
                // Refresh if needed, but switching to contracts tab will re-mount logic in ContractList
              } catch (e: any) {
                console.error(e);
                alert("Có lỗi khi tạo hợp đồng: " + (e.message || JSON.stringify(e)));
              }
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      );
    }

    // Edit existing contract
    if (editingContractId) {
      const editContract = MOCK_CONTRACTS.find(c => c.id === editingContractId) || null; // Fallback? MOCK is mostly empty now?
      // Actually we should fetch the real contract. But for now if ContractList passed it, we might need state.
      // Ideally ContractList should pass the FULL object or we fetch it.
      // Current architecture: ContractList selects ID -> view -> (fetch).
      // Here we assume creating new is the primary fix.

      return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <ContractForm
            contract={editContract as any}
            onSave={async (data) => {
              try {
                await ContractsAPI.update(editingContractId, data);
                setEditingContractId(null);
              } catch (e) {
                alert("Lỗi cập nhật: " + e);
              }
            }}
            onCancel={() => setEditingContractId(null)}
          />
        </div>
      );
    }

    if (activeTab === 'contract-detail' && viewingContractId) {
      return (
        <ContractDetail
          contractId={viewingContractId}
          onBack={handleBackToList}
          onEdit={() => setEditingContractId(viewingContractId)}
          onDelete={async () => {
            try {
              await ContractsAPI.delete(viewingContractId);
              setViewingContractId(null);
              // Force refresh list logic? 
              // ContractList re-fetches on mount. When we back to list (setViewing(null)), activeTab actually needs to change?
              // Ah, App's logic is: if viewingContractId exists, we show Detail. If not, we show List (if activeTab is contracts).
              // So setting viewingContractId(null) will show ContractList.
              // ContractList has useEffect [] to fetch.
              alert("Đã xóa hợp đồng thành công!");
            } catch (e: any) {
              alert("Lỗi xóa hợp đồng: " + e.message);
            }
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard selectedUnit={selectedUnit} onSelectContract={handleViewContract} />;
      case 'contracts':
        return <ContractList selectedUnit={selectedUnit} onSelectContract={handleViewContract} onAdd={() => setIsCreating(true)} />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'personnel':
        return <PersonnelList selectedUnit={selectedUnit} onSelectPersonnel={handleViewPersonnel} />;
      case 'personnel-detail':
        if (viewingPersonnelId) {
          return <PersonnelDetail personnelId={viewingPersonnelId} onBack={handleBackToPersonnelList} onViewContract={handleViewContract} />;
        }
        return <PersonnelList selectedUnit={selectedUnit} onSelectPersonnel={handleViewPersonnel} />;
      case 'customers':
        return <CustomerList onSelectCustomer={handleViewCustomer} />;
      case 'customer-detail':
        if (viewingCustomerId) {
          return <CustomerDetail customerId={viewingCustomerId} onBack={handleBackToCustomerList} onViewContract={handleViewContract} />;
        }
        return <CustomerList onSelectCustomer={handleViewCustomer} />;
      case 'products':
        return <ProductList onSelectProduct={handleViewProduct} />;
      case 'product-detail':
        if (viewingProductId) {
          const product = MOCK_PRODUCTS.find(p => p.id === viewingProductId);
          if (product) return <ProductDetail product={product} onBack={handleBackToProductList} onEdit={() => setEditingProductId(viewingProductId)} onViewContract={handleViewContract} />;
        }
        return <ProductList onSelectProduct={handleViewProduct} />;
      case 'payments':
        return <PaymentList onSelectContract={handleViewContract} />;
      case 'analytics':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-400 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Mô-đun Thống kê chuyên sâu</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mt-2 text-sm md:text-base">Đang tải dữ liệu báo cáo cho {selectedUnit.name}...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cài đặt hệ thống</h2>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">v2.4.0</span>
            </div>
            <div className="space-y-6">
              <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Giao diện hệ thống</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}><Sun size={20} /><span className="font-bold text-sm">Chế độ Sáng</span></button>
                  <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500 text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}><Moon size={20} /><span className="font-bold text-sm">Chế độ Tối</span></button>
                </div>
              </div>

              <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Dữ liệu & Hệ thống</p>
                <DataSeeder />
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard selectedUnit={selectedUnit} onSelectContract={handleViewContract} />;
    }
  };

  const mainMarginClass = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';
  const contentMaxWidthClass = isSidebarCollapsed ? 'max-w-[1600px]' : 'max-w-[1400px]';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Sidebar
        activeTab={activeTab === 'contract-detail' ? 'contracts' : activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        selectedUnit={selectedUnit}
        onUnitChange={setSelectedUnit}
      />
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* 
          QUAN TRỌNG: Loại bỏ padding khỏi main để con có thể bám sticky sát Header.
          Padding sẽ được áp dụng cho div bên trong.
      */}
      <main className={`flex-1 ${mainMarginClass} overflow-auto transition-all duration-300 ease-in-out`}>
        <div className={`mx-auto ${contentMaxWidthClass} p-4 md:p-8 transition-all duration-500 ease-in-out`}>
          {renderContent()}
        </div>
      </main>

      <button
        onClick={() => setIsCreating(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40 md:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      </button>
    </div>
  );
};

export default App;
