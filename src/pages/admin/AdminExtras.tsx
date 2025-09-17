import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Shield, Umbrella, Camera, Tent, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Extra, ExtraCategory, ExtraPriceType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const categoryOptions = [
  { value: 'services', label: 'Services' },
  { value: 'safety', label: 'Safety' },
  { value: 'beach', label: 'Beach' },
  { value: 'tech', label: 'Technology' },
  { value: 'camping', label: 'Camping' }
];

const priceTypeOptions = [
  { value: 'one_time', label: 'One Time' },
  { value: 'per_day', label: 'Per Day (Deprecated)' }
];

const iconOptions = [
  'Fuel', 'Sparkles', 'Baby', 'Armchair', 'Umbrella', 'ShoppingCart', 
  'Package', 'Backpack', 'Package2', 'Camera', 'Battery'
];

const AdminExtras: React.FC = () => {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    price_type: 'one_time' as ExtraPriceType,
    category: 'services' as ExtraCategory,
    stock_quantity: '',
    max_per_booking: '99',
    icon_name: 'Package',
    sort_order: '0',
    active: true
  });

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('extras')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setExtras(data || []);
    } catch (error) {
      console.error('Error fetching extras:', error);
      toast.error('Failed to load extras');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price: parseFloat(formData.price),
        price_type: formData.price_type,
        category: formData.category,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        max_per_booking: parseInt(formData.max_per_booking) || 99,
        icon_name: formData.icon_name || null,
        sort_order: parseInt(formData.sort_order) || 0,
        active: formData.active
      };

      if (editingExtra) {
        const { error } = await supabase
          .from('extras')
          .update(dataToSubmit)
          .eq('id', editingExtra.id);

        if (error) throw error;
        toast.success('Extra updated successfully');
      } else {
        const { error } = await supabase
          .from('extras')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success('Extra created successfully');
      }

      resetForm();
      fetchExtras();
    } catch (error: any) {
      console.error('Error saving extra:', error);
      toast.error(error.message || 'Failed to save extra');
    }
  };

  const handleEdit = (extra: Extra) => {
    setEditingExtra(extra);
    setFormData({
      name: extra.name,
      slug: extra.slug,
      description: extra.description || '',
      price: extra.price.toString(),
      price_type: extra.price_type,
      category: extra.category,
      stock_quantity: extra.stock_quantity?.toString() || '',
      max_per_booking: extra.max_per_booking.toString(),
      icon_name: extra.icon_name || 'Package',
      sort_order: extra.sort_order.toString(),
      active: extra.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra?')) return;

    try {
      const { error } = await supabase
        .from('extras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Extra deleted successfully');
      fetchExtras();
    } catch (error: any) {
      console.error('Error deleting extra:', error);
      toast.error(error.message || 'Failed to delete extra');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('extras')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Extra ${!active ? 'activated' : 'deactivated'} successfully`);
      fetchExtras();
    } catch (error) {
      console.error('Error toggling extra status:', error);
      toast.error('Failed to update extra status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      price_type: 'one_time',
      category: 'services',
      stock_quantity: '',
      max_per_booking: '99',
      icon_name: 'Package',
      sort_order: '0',
      active: true
    });
    setEditingExtra(null);
    setShowForm(false);
  };

  const filteredExtras = extras.filter(extra =>
    extra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    extra.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: ExtraCategory) => {
    switch (category) {
      case 'services': return <Package className="w-4 h-4" />;
      case 'safety': return <Shield className="w-4 h-4" />;
      case 'beach': return <Umbrella className="w-4 h-4" />;
      case 'tech': return <Camera className="w-4 h-4" />;
      case 'camping': return <Tent className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manage Extras</h1>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={20} />}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Extra
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search extras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={20} />}
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingExtra ? 'Edit Extra' : 'Add New Extra'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                />
              </div>
              
              <div>
                <Input
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  disabled={editingExtra !== null}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              
              <div>
                <Input
                  label="Price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Select
                  label="Price Type"
                  value={formData.price_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_type: e.target.value as ExtraPriceType }))}
                  options={priceTypeOptions}
                />
              </div>
              
              <div>
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExtraCategory }))}
                  options={categoryOptions}
                />
              </div>
              
              <div>
                <Input
                  label="Stock Quantity (leave empty for unlimited)"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                />
              </div>
              
              <div>
                <Input
                  label="Max Per Booking"
                  type="number"
                  value={formData.max_per_booking}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_per_booking: e.target.value }))}
                />
              </div>
              
              <div>
                <Select
                  label="Icon"
                  value={formData.icon_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                  options={iconOptions.map(icon => ({ value: icon, label: icon }))}
                />
              </div>
              
              <div>
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary">
                {editingExtra ? 'Update' : 'Create'} Extra
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Extras List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredExtras.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">No extras found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExtras.map((extra) => (
                <tr key={extra.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{extra.name}</div>
                      <div className="text-sm text-gray-500">{extra.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(extra.category)}
                      <span className="text-sm text-gray-900 capitalize">{extra.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${extra.price.toFixed(2)}
                      <span className="text-gray-500 ml-1">
                        / trip
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {extra.stock_quantity === null ? 'Unlimited' : extra.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        extra.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {extra.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleActive(extra.id, extra.active)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      {extra.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(extra)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <Edit2 className="inline w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(extra.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminExtras; 