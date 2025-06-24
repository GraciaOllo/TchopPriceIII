import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicLanding from './pages/Public/PublicLanding';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Prices from './pages/Prices/Prices';
import Products from './pages/Products/Products';
import Profile from './pages/Profile/Profile';
import Messages from './pages/Messages/Messages';
import Payments from './pages/Payments/Payments';
import AdminPanel from './pages/Admin/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#10B981',
                color: '#fff',
              },
            }}
          />
          
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/prices" element={
              <ProtectedRoute>
                <Layout>
                  <Prices />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/products" element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Layout>
                  <Messages />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/payments" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Layout>
                  <Payments />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;