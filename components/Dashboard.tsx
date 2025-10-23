import React, { useState, useEffect, useCallback } from 'react';
import type { Product, ProductSet } from '../types';
import { ActiveTab } from '../types';
import { facebookService } from '../services/facebookService';
import { ProductManager } from './ProductManager';
import { SetManager } from './SetManager';

interface DashboardProps {
  accessToken: string;
  catalogId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ accessToken, catalogId }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.PRODUCTS);
  const [products, setProducts] = useState<Product[]>([]);
  const [sets, setSets] = useState<ProductSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsData, setsData] = await Promise.all([
        facebookService.getProducts(catalogId, accessToken),
        facebookService.getProductSets(catalogId, accessToken)
      ]);
      setProducts(productsData);
      setSets(setsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data. Please check your permissions and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, catalogId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const TabButton: React.FC<{ tab: ActiveTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-facebook-blue text-white'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-facebook-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xl text-gray-600">Loading Catalog...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700">An Error Occurred</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex space-x-2 border-b pb-4 mb-6">
        <TabButton tab={ActiveTab.PRODUCTS} label={`Products (${products.length})`} />
        <TabButton tab={ActiveTab.SETS} label={`Product Sets (${sets.length})`} />
      </div>

      <div>
        {activeTab === ActiveTab.PRODUCTS && 
            <ProductManager 
                products={products} 
                accessToken={accessToken} 
                catalogId={catalogId}
                onDataChange={fetchData}
            />}
        {activeTab === ActiveTab.SETS && 
            <SetManager 
                sets={sets} 
                products={products}
                accessToken={accessToken} 
                catalogId={catalogId} 
                onDataChange={fetchData}
            />}
      </div>
    </div>
  );
};
