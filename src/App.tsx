import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import PropertyDetailPage from '@/pages/PropertyDetailPage';

const AdminPage = React.lazy(() => import('@/pages/AdminPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium !bg-primary-100 !text-white border border-primary-200' }} />
      <div className="flex flex-col min-h-screen bg-primary-50">
        <Header />
        <div className="flex-1">
          <Suspense fallback={<div className="flex justify-center items-center py-32"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/propiedad/:id" element={<PropertyDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
