import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { CarSeasonalPricing, Car } from '../../types';
import { format } from 'date-fns';

const AdminSeasonalPricing: React.FC = () => {
  const [pricings, setPricings] = useState<(CarSeasonalPricing & { car?: Car })[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<CarSeasonalPricing | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    car_id: '',
    name: '',
    description: '',
    price_per_day: '',
    valid_from: '',
    valid_to: '',
    priority: '50',
    active: true
  });

  useEffect(() => {
    fetchPricings();
    fetchCars();
  }, []);

  const fetchPricings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('car_seasonal_pricing')
        .select(`
          *,
          car:cars(id, make, model, year, price_per_day)
        `)
        .order('valid_from', { ascending: false });

      if (error) throw error;
      setPricings(data || []);
    } catch (error) {
      console.error('Error fetching seasonal pricings:', error);
      toast.error('Failed to load seasonal pricings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('make', { ascending: true });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const pricingData = {
        car_id: formData.car_id,
        name: formData.name,
        description: formData.description || null,
        price_per_day: parseFloat(formData.price_per_day),
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        priority: parseInt(formData.priority),
        active: formData.active
      };

      let error;

      if (editingPricing) {
        const result = await supabase
          .from('car_seasonal_pricing')
          .update(pricingData)
          .eq('id', editingPricing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('car_seasonal_pricing')
          .insert([pricingData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingPricing ? 'Seasonal pricing updated!' : 'Seasonal pricing created!');
      setShowModal(false);
      resetForm();
      fetchPricings();
    } catch (error) {
      console.error('Error saving seasonal pricing:', error);
      toast.error('Failed to save seasonal pricing');
    }
  };

  const handleEdit = (pricing: CarSeasonalPricing & { car?: Car }) => {
    setEditingPricing(pricing);
    setFormData({
      car_id: pricing.car_id,
      name: pricing.name,
      description: pricing.description || '',
      price_per_day: pricing.price_per_day.toString(),
      valid_from: pricing.valid_from,
      valid_to: pricing.valid_to,
      priority: pricing.priority.toString(),
      active: pricing.active
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error } = await supabase
        .from('car_seasonal_pricing')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;

      toast.success('Seasonal pricing deleted!');
      fetchPricings();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting seasonal pricing:', error);
      toast.error('Failed to delete seasonal pricing');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const toggleActive = async (pricing: CarSeasonalPricing) => {
    try {
      const { error } = await supabase
        .from('car_seasonal_pricing')
        .update({ active: !pricing.active })
        .eq('id', pricing.id);

      if (error) throw error;

      toast.success(pricing.active ? 'Pricing deactivated' : 'Pricing activated');
      fetchPricings();
    } catch (error) {
      console.error('Error toggling pricing status:', error);
      toast.error('Failed to update pricing status');
    }
  };

  const resetForm = () => {
    setFormData({
      car_id: '',
      name: '',
      description: '',
      price_per_day: '',
      valid_from: '',
      valid_to: '',
      priority: '50',
      active: true
    });
    setEditingPricing(null);
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 100) return 'Promotion';
    if (priority >= 50) return 'Peak Season';
    return 'Off-Peak';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 100) return 'bg-red-100 text-red-800';
    if (priority >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seasonal Pricing</h1>
          <p className="text-gray-600 mt-2">Manage date-range based pricing for your vehicles</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={20} />}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Add Seasonal Pricing
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How Priority Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>100+:</strong> Promotions (Black Friday, Special Offers)</li>
              <li>• <strong>50-99:</strong> Peak Seasons (Holidays, Summer)</li>
              <li>• <strong>0-49:</strong> Off-Peak Seasons (Winter, Weekdays)</li>
              <li>• Higher priority wins when date ranges overlap</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pricing List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
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
              {pricings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No seasonal pricings yet. Create one to get started!
                  </td>
                </tr>
              ) : (
                pricings.map((pricing) => (
                  <tr key={pricing.id} className={!pricing.active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pricing.car?.make} {pricing.car?.model}
                      </div>
                      <div className="text-sm text-gray-500">{pricing.car?.year}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{pricing.name}</div>
                      {pricing.description && (
                        <div className="text-sm text-gray-500">{pricing.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div>{format(new Date(pricing.valid_from), 'MMM d, yyyy')}</div>
                          <div className="text-gray-500">
                            to {format(new Date(pricing.valid_to), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-gray-900">${pricing.price_per_day}</span>
                        {pricing.car && (
                          <span className="ml-2 text-gray-500">
                            (Base: ${pricing.car.price_per_day})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(pricing.priority)}`}>
                        {getPriorityLabel(pricing.priority)} ({pricing.priority})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(pricing)}
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pricing.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pricing.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(pricing)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(pricing.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete seasonal pricing"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingPricing ? 'Edit Seasonal Pricing' : 'Add Seasonal Pricing'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle *
                  </label>
                  <select
                    required
                    value={formData.car_id}
                    onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a vehicle</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.make} {car.model} {car.year} (Base: ${car.price_per_day}/day)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Black Friday Sale, Christmas Season"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_to}
                      onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Day ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price_per_day}
                      onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="50"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {editingPricing ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Seasonal Pricing</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this seasonal pricing? All pricing data will be permanently removed.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSeasonalPricing;
