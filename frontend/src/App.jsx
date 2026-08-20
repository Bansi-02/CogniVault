import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Landing from './components/Landing/Landing'
import Features from './components/Landing/Features'
import WhyCognivault from './components/Landing/WhyCognivault'
import Pricing from './components/Landing/Pricing'
import Partnerships from './components/Landing/Partnerships'
import Login from './components/Auth/Login'
import Checkout from './components/Auth/Checkout'
import ProtectedRoute, { AdminRoute } from './components/Auth/ProtectedRoute'
import DashboardLayout from './components/Dashboard/DashboardLayout'

// Legal Pages
import LegalPrivacy from './components/Legal/LegalPrivacy'
import LegalTerms from './components/Legal/LegalTerms'
import SupportPage from './components/Legal/SupportPage'
import EnterpriseContact from './components/Landing/EnterpriseContact'
import DocumentVault from './components/Dashboard/DocumentVault'
import ExecutiveSummary from './components/Dashboard/ExecutiveSummary'
import SemanticSearch from './components/Dashboard/SemanticSearch'
import Redlining from './components/Dashboard/Redlining'
import FinancialForecaster from './components/Dashboard/FinancialForecaster'
import AIClassification from './components/Dashboard/AIClassification'
import VendorRiskScreening from './components/Dashboard/VendorRiskScreening'

import CommunicationShield from './components/Dashboard/CommunicationShield'
import KnowledgeGraph from './components/Dashboard/KnowledgeGraph'
import GenerativeDrafter from './components/Dashboard/GenerativeDrafter'
import FraudAnalytics from './components/Dashboard/FraudAnalytics'
import ComplianceOracle from './components/Dashboard/ComplianceOracle'
import PrivacyRedactor from './components/Dashboard/PrivacyRedactor'
import InsiderThreat from './components/Dashboard/InsiderThreat'
import HelpCenter from './components/Dashboard/HelpCenter'
import ClientBillingPage from './components/Dashboard/ClientBillingPage'

// Admin Components
import AdminLayout from './components/Admin/AdminLayout'
import AdminOverview from './components/Admin/AdminOverview'
import AdvertiserCRM from './components/Admin/AdvertiserCRM'
import ClientManager from './components/Admin/ClientManager'
import AdminSupport from './components/Admin/AdminSupport'
import AdminEnterprise from './components/Admin/AdminEnterprise'
import AdminBilling from './components/Admin/AdminBilling'
import NotFound from './components/NotFound'

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public & Auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/why-cognivault" element={<WhyCognivault />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/partnerships" element={<Partnerships />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/privacy" element={<LegalPrivacy />} />
        <Route path="/terms" element={<LegalTerms />} />
        <Route path="/contact" element={<SupportPage />} />
        <Route path="/enterprise-contact" element={<EnterpriseContact />} />

        {/* Client Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
        <Route path="/vault" element={<ProtectedRoute><DocumentVault /></ProtectedRoute>} />
        <Route path="/summary" element={<ProtectedRoute><ExecutiveSummary /></ProtectedRoute>} />
        <Route path="/semantic-search" element={<ProtectedRoute><SemanticSearch /></ProtectedRoute>} />
        <Route path="/redlining" element={<ProtectedRoute><Redlining /></ProtectedRoute>} />
        <Route path="/forecaster" element={<ProtectedRoute><FinancialForecaster /></ProtectedRoute>} />
        <Route path="/classification" element={<ProtectedRoute><AIClassification /></ProtectedRoute>} />
        <Route path="/vendor-risk" element={<ProtectedRoute><VendorRiskScreening /></ProtectedRoute>} />
        <Route path="/shield" element={<ProtectedRoute><CommunicationShield /></ProtectedRoute>} />
        <Route path="/redactor" element={<ProtectedRoute><PrivacyRedactor /></ProtectedRoute>} />
        <Route path="/insider-threat" element={<ProtectedRoute><InsiderThreat /></ProtectedRoute>} />
        <Route path="/graph" element={<ProtectedRoute><KnowledgeGraph /></ProtectedRoute>} />
        <Route path="/drafter" element={<ProtectedRoute><GenerativeDrafter /></ProtectedRoute>} />
        <Route path="/fraud-analytics" element={<ProtectedRoute><FraudAnalytics /></ProtectedRoute>} />
        <Route path="/compliance-oracle" element={<ProtectedRoute><ComplianceOracle /></ProtectedRoute>} />
        <Route path="/help-center" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><ClientBillingPage /></ProtectedRoute>} />

        {/* Admin Control Center Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="advertisers" element={<AdvertiserCRM />} />
          <Route path="clients" element={<ClientManager />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="enterprise" element={<AdminEnterprise />} />
          <Route path="billing" element={<AdminBilling />} />
        </Route>

        {/* 404 — catch all unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
