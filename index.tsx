
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { ImpersonationProvider } from './contexts/ImpersonationContext';
import { queryClient } from './lib/queryClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImpersonationProvider>
          <RouterProvider router={router} />
        </ImpersonationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
