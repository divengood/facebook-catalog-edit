import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { facebookService } from './services/facebookService';
import type { LoginStatusResponse, Business, Catalog, AuthResponse } from './types';

// IMPORTANT: Replace with your own Facebook App ID
const YOUR_FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID_HERE';

const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-8 w-8 text-facebook-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export default function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatusResponse | null>(null);
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (YOUR_FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID_HERE') {
        setError('Please configure your Facebook App ID in App.tsx');
        return;
    }
    async function initialize() {
      await facebookService.sdkInit(YOUR_FACEBOOK_APP_ID);
      setSdkReady(true);
      const status = await facebookService.getLoginStatus();
      setLoginStatus(status);
      if (status.status === 'connected') {
        setAuth(status.authResponse);
      }
    }
    initialize();
  }, []);

  useEffect(() => {
    async function fetchBusinesses() {
      if (auth) {
        setIsLoading(true);
        setError(null);
        try {
          const biz = await facebookService.getBusinesses(auth.userID, auth.accessToken);
          setBusinesses(biz);
          if (biz.length > 0) {
              setSelectedBusinessId(biz[0].id);
          }
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchBusinesses();
  }, [auth]);

  useEffect(() => {
    async function fetchCatalogs() {
      if (selectedBusinessId && auth) {
        setIsLoading(true);
        setError(null);
        setCatalogs([]);
        setSelectedCatalogId('');
        try {
          const cats = await facebookService.getCatalogs(selectedBusinessId, auth.accessToken);
          setCatalogs(cats);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchCatalogs();
  }, [selectedBusinessId, auth]);


  const handleLogin = async () => {
    const response = await facebookService.login();
    setLoginStatus(response);
    if (response.status === 'connected') {
        setAuth(response.authResponse);
    }
  };

  const handleLogout = async () => {
    await facebookService.logout();
    setLoginStatus(null);
    setAuth(null);
    setBusinesses([]);
    setCatalogs([]);
    setSelectedBusinessId('');
    setSelectedCatalogId('');
  }

  const Header = () => (
    <header className="bg-white shadow-md p-4 mb-8">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <svg className="w-10 h-10 text-facebook-blue" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.494v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path></svg>
            <h1 className="text-2xl font-bold text-gray-800">Facebook Catalog Manager</h1>
        </div>
        {auth && (
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-facebook-blue"
          >
            Disconnect
          </button>
        )}
      </div>
    </header>
  );

  const renderContent = () => {
    if (error) {
        return <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md text-center text-red-600">{error}</div>
    }
    if (!sdkReady || !loginStatus) {
      return <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md"><Spinner /></div>
    }

    if (loginStatus.status !== 'connected' || !auth) {
      return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect to Facebook</h2>
          <p className="text-sm text-gray-500 mb-6">Log in to start managing your product catalogs.</p>
          <button onClick={handleLogin} className="w-full py-2 px-4 bg-facebook-blue text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
            Login with Facebook
          </button>
        </div>
      );
    }
    
    if (selectedCatalogId && auth) {
      return <Dashboard accessToken={auth.accessToken} catalogId={selectedCatalogId} />;
    }

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">Select a Catalog</h2>
             {isLoading && <Spinner />}
             {!isLoading && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Business Account</label>
                        <select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue"
                            disabled={businesses.length === 0}
                        >
                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                         {businesses.length === 0 && <p className="text-xs text-gray-500 mt-1">No business accounts found with catalog permissions.</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Product Catalog</label>
                        <select
                            value={selectedCatalogId}
                            onChange={(e) => setSelectedCatalogId(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue"
                            disabled={!selectedBusinessId || catalogs.length === 0}
                        >
                        <option value="">-- Select a catalog --</option>
                        {catalogs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {selectedBusinessId && catalogs.length === 0 && <p className="text-xs text-gray-500 mt-1">No catalogs found for this business.</p>}
                    </div>
                </div>
             )}
        </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pb-8">
        {renderContent()}
      </main>
    </div>
  );
}
