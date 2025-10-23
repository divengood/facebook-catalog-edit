import type { Product, ProductSet, Business, Catalog, LoginStatusResponse, AuthResponse } from '../types';

const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

declare global {
  interface Window {
    FB: any;
    // FIX: Add fbAsyncInit to window type for Facebook SDK initialization.
    fbAsyncInit?: () => void;
  }
}

const apiCall = async (path: string, method: 'GET' | 'POST' | 'DELETE', token: string, params: Record<string, any> = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.append('access_token', token);

  const options: RequestInit = { method };

  if (method === 'GET') {
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  } else {
    options.body = new URLSearchParams(params);
    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }
  
  const response = await fetch(url.toString(), options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Facebook API request failed');
  }
  return data;
};

export const facebookService = {
  sdkInit: (appId: string): Promise<void> => {
    return new Promise(resolve => {
        window.fbAsyncInit = function() {
            window.FB.init({
                appId,
                cookie: true,
                xfbml: true,
                version: GRAPH_API_VERSION
            });
            resolve();
        };
    });
  },

  getLoginStatus: (): Promise<LoginStatusResponse> => {
    return new Promise(resolve => window.FB.getLoginStatus(resolve));
  },

  login: (): Promise<LoginStatusResponse> => {
      return new Promise(resolve => window.FB.login(resolve, { scope: 'catalog_management,business_management,pages_show_list' }));
  },

  logout: (): Promise<void> => {
      return new Promise(resolve => window.FB.logout(resolve));
  },
  
  getBusinesses: (userId: string, token: string): Promise<Business[]> => 
    apiCall(`/${userId}/businesses`, 'GET', token).then(res => res.data),

  getCatalogs: (businessId: string, token: string): Promise<Catalog[]> => 
    apiCall(`/${businessId}/owned_product_catalogs`, 'GET', token).then(res => res.data),

  getProducts: async (catalogId: string, token: string): Promise<Product[]> => {
    const fields = 'id,name,description,brand,url,price,currency,image_url';
    const response = await apiCall(`/${catalogId}/products`, 'GET', token, { fields, limit: 100 });
    // Note: This implementation doesn't handle pagination for catalogs with >100 products.
    return response.data.map((p: any) => ({
        ...p,
        link: p.url,
        image: { url: p.image_url }
    }));
  },

  addProducts: (catalogId: string, token: string, products: Omit<Product, 'id'>[]): Promise<any> => {
    const requests = products.map(p => ({
        method: 'POST',
        retailer_id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: {
            name: p.name,
            description: p.description,
            brand: p.brand,
            url: p.link,
            image_url: p.image.url,
            price: p.price * 100, // Price in cents
            currency: p.currency,
        },
    }));
    return apiCall(`/${catalogId}/products_batch`, 'POST', token, { requests: JSON.stringify(requests) });
  },

  deleteProducts: (catalogId: string, token: string, productIds: string[]): Promise<{ success: boolean }> => {
    // Note: The API expects retailer_ids (your internal IDs), not the Facebook-generated product IDs.
    // This mock assumes the passed IDs are retailer_ids. In a real scenario, you'd map your app's IDs to retailer_ids.
    // For this implementation, we will try deleting by the global product id, which requires a different batch format.
    const batch = productIds.map(id => ({
      method: 'DELETE',
      relative_url: id,
    }));
    return apiCall('', 'POST', token, { batch: JSON.stringify(batch) });
  },

  getProductSets: async (catalogId: string, token: string): Promise<ProductSet[]> => {
      const response = await apiCall(`/${catalogId}/product_sets`, 'GET', token, { fields: 'id,name,products_count' });
      // To get product_ids, we need to make a call for each set.
      const setsWithProducts = await Promise.all(response.data.map(async (set: any) => {
          const productsResponse = await apiCall(`/${set.id}/products`, 'GET', token, { fields: 'id' });
          return {
              id: set.id,
              name: set.name,
              product_ids: productsResponse.data.map((p: {id: string}) => p.id)
          };
      }));
      return setsWithProducts;
  },

  createProductSets: (catalogId: string, token: string, sets: Omit<ProductSet, 'id'>[]): Promise<ProductSet[]> => {
    const batch = sets.map(s => ({
      method: 'POST',
      relative_url: `${catalogId}/product_sets`,
      body: `name=${encodeURIComponent(s.name)}&filter=${encodeURIComponent(JSON.stringify({'retailer_product_group_id': {'is_any': []}}))}`, // Create empty set
    }));
    return apiCall('', 'POST', token, { batch: JSON.stringify(batch) });
  },

  deleteProductSets: (catalogId: string, token: string, setIds: string[]): Promise<{ success: boolean }> => {
    const batch = setIds.map(id => ({
      method: 'DELETE',
      relative_url: id,
    }));
    return apiCall('', 'POST', token, { batch: JSON.stringify(batch) });
  },

  updateProductSet: async (catalogId: string, token: string, setId: string, updates: Partial<ProductSet>): Promise<ProductSet> => {
      if (!updates.product_ids) {
          throw new Error("Only product_ids updates are supported.");
      }
      // This is a simplified version. A robust implementation would calculate the diff.
      // Here we just replace all products. First, we clear the set.
      const currentProducts = await apiCall(`/${setId}/products`, 'GET', token, { fields: 'id' });
      const currentProductIds = currentProducts.data.map((p: any) => p.id);
      
      if(currentProductIds.length > 0) {
          await apiCall(`/${setId}/products`, 'DELETE', token, { product_ids: JSON.stringify(currentProductIds) });
      }

      // Then, we add the new products.
      if (updates.product_ids.length > 0) {
          await apiCall(`/${setId}/products`, 'POST', token, { product_ids: JSON.stringify(updates.product_ids) });
      }
      
      const updatedSet = await apiCall(`/${setId}`, 'GET', token, { fields: 'id,name' });
      return { ...updatedSet, product_ids: updates.product_ids };
  },
};