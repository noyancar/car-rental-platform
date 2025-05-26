import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Check, X, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminStore } from '../../stores/adminStore';
import type { DiscountCode } from '../../types';

const AdminDiscountCodes: React.FC = () => {
  const { 
    discountCodes, 
    loading, 
    error,
    fetchDiscountCodes,
    addDiscountCode,
    updateDiscountCode,
    toggleDiscountCodeStatus
  } = useAdminStore();
  
  const [isAddingCode, setIsAddingCode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  
  const [newCode, setNewCode] = useState({
    code: '',
    discount_percentage: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date().toISOString().split('T')[0],
    max_uses: 100,
    active: true,
  });
  
  useEffect(() => {
    fetchDiscountCodes();
  }, [fetchDiscountCodes]);
  
  const handleAddCode = async () => {
    try {
      await addDiscountCode(newCode);
      setIsAddingCode(false);
      setNewCode({
        code: '',
        discount_percentage: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: new Date().toISOString().split('T')[0],
        max_uses: 100,
        active: true,
      });
      toast.success('Discount code added successfully');
    } catch (error) {
      toast.error('Failed to add discount code');
    }
  };
  
  const handleUpdateCode = async (code: DiscountCode) => {
    try {
      await updateDiscountCode(code.id, code);
      setEditingCode(null);
      toast.success('Discount code updated successfully');
    } catch (error) {
      toast.error('Failed to update discount code');
    }
  };
  
  const handleToggleStatus = async (id: number, active: boolean) => {
    try {
      await toggleDiscountCodeStatus(id, active);
      toast.success(`Discount code ${active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update discount code status');
    }
  };
  
  const filteredCodes = discountCodes.filter(code => 
    code.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading discount codes: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-800">
            Manage Discount Codes
          </h1>
          <Button 
            variant="primary"
            onClick={() => setIsAddingCode(true)}
            leftIcon={<Plus size={20} />}
          >
            Add New Code
          </Button>
        </div>
        
        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <Input
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={20} />}
          />
        </div>
        
        {/* Discount Codes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Discount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Valid Period</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Usage</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-secondary-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredCodes.map((code) => (
                  <tr key={code.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-primary-800 mr-2" />
                        <span className="font-medium">{code.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {code.discount_percentage}% OFF
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>From: {new Date(code.valid_from).toLocaleDateString()}</div>
                        <div>To: {new Date(code.valid_to).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {code.current_uses} / {code.max_uses}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        code.active 
                          ? 'bg-success-50 text-success-500' 
                          : 'bg-error-50 text-error-500'
                      }`}>
                        {code.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCode(code)}
                          leftIcon={<Edit size={16} />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={code.active ? 'error' : 'success'}
                          size="sm"
                          onClick={() => handleToggleStatus(code.id, !code.active)}
                          leftIcon={code.active ? <X size={16} /> : <Check size={16} />}
                        >
                          {code.active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      {(isAddingCode || editingCode) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                {isAddingCode ? 'Add New Discount Code' : 'Edit Discount Code'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Code"
                  value={editingCode?.code || newCode.code}
                  onChange={(e) => editingCode 
                    ? setEditingCode({ ...editingCode, code: e.target.value })
                    : setNewCode({ ...newCode, code: e.target.value })
                  }
                  placeholder="SUMMER2025"
                />
                
                <Input
                  label="Discount Percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={editingCode?.discount_percentage || newCode.discount_percentage}
                  onChange={(e) => editingCode
                    ? setEditingCode({ ...editingCode, discount_percentage: parseInt(e.target.value) })
                    : setNewCode({ ...newCode, discount_percentage: parseInt(e.target.value) })
                  }
                />
                
                <Input
                  label="Valid From"
                  type="date"
                  value={editingCode?.valid_from || newCode.valid_from}
                  onChange={(e) => editingCode
                    ? setEditingCode({ ...editingCode, valid_from: e.target.value })
                    : setNewCode({ ...newCode, valid_from: e.target.value })
                  }
                />
                
                <Input
                  label="Valid To"
                  type="date"
                  value={editingCode?.valid_to || newCode.valid_to}
                  onChange={(e) => editingCode
                    ? setEditingCode({ ...editingCode, valid_to: e.target.value })
                    : setNewCode({ ...newCode, valid_to: e.target.value })
                  }
                />
                
                <Input
                  label="Maximum Uses"
                  type="number"
                  min="1"
                  value={editingCode?.max_uses || newCode.max_uses}
                  onChange={(e) => editingCode
                    ? setEditingCode({ ...editingCode, max_uses: parseInt(e.target.value) })
                    : setNewCode({ ...newCode, max_uses: parseInt(e.target.value) })
                  }
                />
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingCode(false);
                    setEditingCode(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => editingCode ? handleUpdateCode(editingCode) : handleAddCode()}
                >
                  {editingCode ? 'Update Code' : 'Add Code'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountCodes;