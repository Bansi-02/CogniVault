import React from 'react';
import { useNavigate } from 'react-router-dom';
import BillingPanel from './BillingPanel';

const ClientBillingPage = () => {
  const navigate = useNavigate();
  return <BillingPanel onClose={() => navigate('/dashboard')} />;
};

export default ClientBillingPage;
