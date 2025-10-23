import React, { useState } from 'react';
import type { Product } from '../types';
import { facebookService } from '../services/facebookService';
import { Modal } from './Modal';
import { AddProductForm } from './AddProductForm';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProductManagerProps {
  products: Product[];
  accessToken: string;
  catalogId: string;
  onDataChange: () => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ products, accessToken, catalogId, onDataChange }) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(products.map(p => p.id));
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedProducts(newSelection);
  };

  const handleAddProducts = async (newProducts: Omit<Product, 'id'>[]) => {
    try {
      await facebookService.addProducts(catalogId, accessToken, newProducts);
      onDataChange();
    } catch (error) {
      console.error("Failed to add products:", error);
      alert("Error adding products. See console for details.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)? This action might be irreversible.`)) {
      setIsDeleting(true);
      try {
        await facebookService.deleteProducts(catalogId, accessToken, Array.from(selectedProducts));
        setSelectedProducts(new Set());
        onDataChange();
      } catch (error) {
        console.error("Failed to delete products:", error);
        alert("Error deleting products. See console for details.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Manage Products</h2>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleDeleteSelected}
                    disabled={selectedProducts.size === 0 || isDeleting}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed">
                    <TrashIcon className="w-5 h-5 mr-2" />
                    {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProducts.size})`}
                </button>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-facebook-blue hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Products
                </button>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-4 w-12 text-left">
                            <input type="checkbox" 
                                className="h-4 w-4 text-facebook-blue border-gray-300 rounded focus:ring-facebook-blue"
                                onChange={handleSelectAll}
                                checked={products.length > 0 && selectedProducts.size === products.length} />
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {products.map(product => (
                        <tr key={product.id} className={selectedProducts.has(product.id) ? 'bg-blue-50' : ''}>
                            <td className="p-4">
                                <input type="checkbox" 
                                    className="h-4 w-4 text-facebook-blue border-gray-300 rounded focus:ring-facebook-blue"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={() => handleSelectOne(product.id)} />
                            </td>
                            <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-12 w-12">
                                        <img className="h-12 w-12 rounded-md object-cover" src={product.image.url} alt={product.name} />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{product.brand}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.id}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {products.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>No products found in this catalog.</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-facebook-blue font-semibold">Add your first product</button>
                </div>
            )}
        </div>

        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Products">
            <AddProductForm onAddProducts={handleAddProducts} onClose={() => setIsAddModalOpen(false)} />
        </Modal>
    </div>
  );
};
