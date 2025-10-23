import React, { useState, useCallback } from 'react';
import type { Product } from '../types';
import { geminiService } from '../services/geminiService';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';

type NewProduct = Omit<Product, 'id'> & { client_id: number };

interface AddProductFormProps {
  onAddProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
  onClose: () => void;
}

const emptyProduct = (id: number): NewProduct => ({
  client_id: id,
  name: '',
  description: '',
  brand: '',
  link: '',
  price: 0,
  currency: 'USD',
  image: { url: '' },
});

export const AddProductForm: React.FC<AddProductFormProps> = ({ onAddProducts, onClose }) => {
  const [products, setProducts] = useState<NewProduct[]>([emptyProduct(Date.now())]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingDescIndex, setGeneratingDescIndex] = useState<number | null>(null);

  const handleInputChange = <K extends keyof Omit<NewProduct, 'image' | 'client_id'>>(
    index: number,
    field: K,
    value: NewProduct[K]
  ) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };
  
  const handleImageUrlChange = (index: number, url: string) => {
    const newProducts = [...products];
    newProducts[index].image.url = url;
    setProducts(newProducts);
  };

  const handleAddProductForm = () => {
    setProducts([...products, emptyProduct(Date.now())]);
  };

  const handleRemoveProductForm = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleGenerateDescription = useCallback(async (index: number) => {
    const productName = products[index].name;
    if (!productName) {
      alert("Please enter a product name first.");
      return;
    }
    setGeneratingDescIndex(index);
    try {
      const description = await geminiService.generateDescription(productName);
      handleInputChange(index, 'description', description);
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description.");
    } finally {
      setGeneratingDescIndex(null);
    }
  }, [products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const productsToSubmit = products.map(({ client_id, ...p }) => p);
    await onAddProducts(productsToSubmit);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="space-y-6">
            {products.map((product, index) => (
            <div key={product.client_id} className="p-4 border rounded-lg relative bg-gray-50">
                {products.length > 1 && (
                <button type="button" onClick={() => handleRemoveProductForm(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <TrashIcon className="w-5 h-5" />
                </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-2 h-32">
                    {product.image.url ? (
                        <img src={product.image.url} alt="Preview" className="h-full w-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} onLoad={(e) => e.currentTarget.style.display = 'block'}/>
                    ) : (
                        <div className="text-center text-gray-500 text-sm">Provide Image URL</div>
                    )}
                    </div>
                     <input type="url" placeholder="https://example.com/image.png" value={product.image.url} onChange={(e) => handleImageUrlChange(index, e.target.value)} className="mt-2 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required/>
                </div>
                <div className="md:col-span-2 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input type="text" value={product.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <div className="relative">
                            <textarea value={product.description} onChange={(e) => handleInputChange(index, 'description', e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required />
                            <button type="button" onClick={() => handleGenerateDescription(index)} disabled={generatingDescIndex === index} className="absolute bottom-2 right-2 p-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-full text-white disabled:bg-gray-300">
                                {generatingDescIndex === index ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <SparklesIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Brand</label>
                        <input type="text" value={product.brand} onChange={(e) => handleInputChange(index, 'brand', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Link</label>
                        <input type="url" value={product.link} onChange={(e) => handleInputChange(index, 'link', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input type="number" step="0.01" value={product.price} onChange={(e) => handleInputChange(index, 'price', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <input type="text" value={product.currency} onChange={(e) => handleInputChange(index, 'currency', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue" required/>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>
        <div className="mt-6 flex justify-between items-center">
            <button type="button" onClick={handleAddProductForm} className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-facebook-blue bg-blue-100 hover:bg-blue-200">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Another Product
            </button>
            <div className="flex items-center gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-facebook-blue hover:bg-blue-700 disabled:bg-blue-300">
                    {isSubmitting ? 'Submitting...' : `Add ${products.length} Product(s)`}
                </button>
            </div>
        </div>
    </form>
  );
};
