export interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  link: string;
  price: number;
  currency: string;
  image: {
    url: string;
  };
}

export interface ProductSet {
  id: string;
  name: string;
  product_ids: string[];
}

export enum ActiveTab {
  PRODUCTS = 'products',
  SETS = 'sets',
}

// New types for Facebook API
export interface Business {
  id:string;
  name: string;
}

export interface Catalog {
  id: string;
  name: string;
}

// Type for Facebook SDK AuthResponse
export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
  graphDomain: string;
  data_access_expiration_time: number;
}

// Type for Facebook SDK Login Status Response
export interface LoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse: AuthResponse | null;
}
