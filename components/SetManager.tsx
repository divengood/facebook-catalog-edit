import React, { useState } from 'react';
import type { Product, ProductSet } from '../types';
import { facebookService } from '../services/facebookService';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SetManagerProps {
  sets: ProductSet[];
  products: Product[];
  accessToken: string;
  catalogId: string;
  onDataChange: () => void;
}

const CreateSetForm: React.FC<{
    onSubmit: (name: string) => void; 
    onClose: () => void;
}> = ({ onSubmit, onClose }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(name) {
            onSubmit(name);
        }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="setName" className="block text-sm font-medium text-gray-700">Set Name</label>
                <input
                    type="text"
                    id="setName"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-facebook-blue focus:border-facebook-blue"
                    required
                />
            </div>
             <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-facebook-blue hover:bg-blue-700">Create Set</button>
            </div>
        </form>
    );
};


const EditSetForm: React.FC<{
    set: ProductSet;
    allProducts: Product[];
    onSubmit: (productIds: string[]) => void;
    onClose: () => void;
}> = ({ set, allProducts, onSubmit, onClose }) => {
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set(set.product_ids));

    const handleToggleProduct = (productId: string) => {
        const newSelection = new Set(selectedProductIds);
        if (newSelection.has(productId)) {
            newSelection.delete(productId);
        } else {
            newSelection.add(productId);
        }
        setSelectedProductIds(newSelection);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(Array.from(selectedProductIds));
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <p className="text-gray-600">Select products to include in the "{set.name}" set.</p>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {allProducts.map(product => (
                        <div key={product.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                             <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={selectedProductIds.has(product.id)}
                                onChange={() => handleToggleProduct(product.id)}
                                className="h-4 w-4 text-facebook-blue border-gray-300 rounded focus:ring-facebook-blue"
                            />
                            <label htmlFor={`product-${product.id}`} className="ml-3 flex items-center cursor-pointer">
                               <img src={product.image.url} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-3" />
                                <div>
                                    <p className="font-medium text-gray-800">{product.name}</p>
                                    <p className="text-sm text-gray-500 font-mono">{product.id}</p>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-facebook-blue hover:bg-blue-700">Save Changes</button>
            </div>
        </form>
    )
}


export const SetManager: React.FC<SetManagerProps> = ({ sets, products, accessToken, catalogId, onDataChange }) => {
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<ProductSet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSets(new Set(sets.map(s => s.id)));
    } else {
      setSelectedSets(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedSets);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSets(newSelection);
  };

  const handleCreateSet = async (name: string) => {
    try {
        await facebookService.createProductSets(catalogId, accessToken, [{ name, product_ids: [] }]);
        onDataChange();
        setIsCreateModalOpen(false);
    } catch(e) {
        alert("Failed to create set");
    }
  }

  const handleDeleteSelected = async () => {
    if(selectedSets.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedSets.size} set(s)?`)) {
        setIsDeleting(true);
        try {
            await facebookService.deleteProductSets(catalogId, accessToken, Array.from(selectedSets));
            setSelectedSets(new Set());
            onDataChange();
        } catch(e) {
            alert("Failed to delete sets");
        } finally {
            setIsDeleting(false);
        }
    }
  }

  const handleUpdateSet = async (productIds: string[]) => {
    if(!editingSet) return;
    try {
        await facebookService.updateProductSet(catalogId, accessToken, editingSet.id, { product_ids: productIds });
        onDataChange();
        setEditingSet(null);
    } catch(e) {
        alert("Failed to update set");
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Manage Product Sets</h2>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleDeleteSelected}
                    disabled={selectedSets.size === 0 || isDeleting}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed">
                     <TrashIcon className="w-5 h-5 mr-2" />
                    {isDeleting ? 'Deleting...' : `Delete Selected (${selectedSets.size})`}
                </button>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-facebook-blue hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Set
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
                                checked={sets.length > 0 && selectedSets.size === sets.length} />
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set Name</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Count</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sets.map(set => (
                        <tr key={set.id}>
                             <td className="p-4">
                                <input type="checkbox" 
                                    className="h-4 w-4 text-facebook-blue border-gray-300 rounded focus:ring-facebook-blue"
                                    checked={selectedSets.has(set.id)}
                                    onChange={() => handleSelectOne(set.id)} />
                            </td>
                            <td className="p-4 whitespace-nowrap font-medium text-gray-900">{set.name}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{set.product_ids.length}</td>
                            <td className="p-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => setEditingSet(set)} className="text-facebook-blue hover:text-blue-800">Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {sets.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>No product sets found.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-facebook-blue font-semibold">Create your first set</button>
                </div>
            )}
        </div>

        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Product Set">
            <CreateSetForm onSubmit={handleCreateSet} onClose={() => setIsCreateModalOpen(false)} />
        </Modal>

        {editingSet && (
            <Modal isOpen={!!editingSet} onClose={() => setEditingSet(null)} title={`Edit Set: ${editingSet.name}`}>
                <EditSetForm 
                    set={editingSet} 
                    allProducts={products}
                    onSubmit={handleUpdateSet}
                    onClose={() => setEditingSet(null)}
                />
            </Modal>
        )}
    </div>
  );
};
