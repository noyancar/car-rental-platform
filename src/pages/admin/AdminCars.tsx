import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminStore } from '../../stores/adminStore';
import type { Car } from '../../types';

const COMMON_FEATURES = [
  'Leather Seats',
  'Navigation',
  'Heated Seats',
  'Sunroof',
  'Backup Camera',
  'Bluetooth',
  'AC',
  'Cruise Control',
  'Premium Sound',
  'Sport Mode',
];

const AdminCars: React.FC = () => {
  const { 
    allCars, 
    loading, 
    error,
    fetchAllCars,
    addCar,
    updateCar,
    toggleCarAvailability
  } = useAdminStore();
  
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState('');
  
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price_per_day: 0,
    category: '',
    image_url: '',
    description: '',
    features: [] as string[],
    seats: 5,
    transmission: 'Automatic',
    mileage_type: 'Unlimited',
  });
  
  useEffect(() => {
    fetchAllCars();
  }, [fetchAllCars]);
  
  const handleAddFeature = () => {
    if (!customFeature.trim()) return;
    
    const feature = customFeature.trim();
    const features = editingCar?.features || newCar.features;
    
    if (!features.includes(feature)) {
      if (editingCar) {
        setEditingCar({ ...editingCar, features: [...features, feature] });
      } else {
        setNewCar({ ...newCar, features: [...features, feature] });
      }
    }
    
    setCustomFeature('');
  };
  
  const handleRemoveFeature = (feature: string) => {
    const features = editingCar?.features || newCar.features;
    const updatedFeatures = features.filter(f => f !== feature);
    
    if (editingCar) {
      setEditingCar({ ...editingCar, features: updatedFeatures });
    } else {
      setNewCar({ ...newCar, features: updatedFeatures });
    }
  };
  
  const handleToggleCommonFeature = (feature: string) => {
    const features = editingCar?.features || newCar.features;
    const hasFeature = features.includes(feature);
    
    const updatedFeatures = hasFeature
      ? features.filter(f => f !== feature)
      : [...features, feature];
    
    if (editingCar) {
      setEditingCar({ ...editingCar, features: updatedFeatures });
    } else {
      setNewCar({ ...newCar, features: updatedFeatures });
    }
  };
  
  const handleAddCar = async () => {
    try {
      if (newCar.features.length === 0) {
        toast.error('Please add at least one feature');
        return;
      }
      
      await addCar(newCar);
      setIsAddingCar(false);
      setNewCar({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        price_per_day: 0,
        category: '',
        image_url: '',
        description: '',
        features: [],
        seats: 5,
        transmission: 'Automatic',
        mileage_type: 'Unlimited',
      });
      toast.success('Car added successfully');
    } catch (error) {
      toast.error('Failed to add car');
    }
  };
  
  const handleUpdateCar = async (car: Car) => {
    try {
      if (car.features.length === 0) {
        toast.error('Please add at least one feature');
        return;
      }
      
      await updateCar(car.id, car);
      setEditingCar(null);
      toast.success('Car updated successfully');
    } catch (error) {
      toast.error('Failed to update car');
    }
  };
  
  const handleToggleAvailability = async (id: number, available: boolean) => {
    try {
      await toggleCarAvailability(id, available);
      toast.success(`Car ${available ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update car availability');
    }
  };
  
  const filteredCars = allCars.filter(car => {
    const matchesSearch = (
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = !filterCategory || car.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
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
          Error loading cars: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-800">
            Manage Cars
          </h1>
          <Button 
            variant="primary"
            onClick={() => setIsAddingCar(true)}
            leftIcon={<Plus size={20} />}
          >
            Add New Car
          </Button>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={20} />}
            />
            
            <Select
              options={[
                { value: '', label: 'All Categories' },
                { value: 'luxury', label: 'Luxury' },
                { value: 'sports', label: 'Sports' },
                { value: 'suv', label: 'SUV' },
                { value: 'sedan', label: 'Sedan' },
                { value: 'convertible', label: 'Convertible' },
                { value: 'electric', label: 'Electric' },
              ]}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
          </div>
        </div>
        
        {/* Cars List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Car</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Price/Day</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-secondary-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredCars.map((car) => (
                  <tr key={car.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img 
                          src={car.image_url} 
                          alt={`${car.make} ${car.model}`}
                          className="h-12 w-16 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="font-medium">{car.make} {car.model}</div>
                          <div className="text-sm text-secondary-500">{car.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-sm bg-secondary-100">
                        {car.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      ${car.price_per_day}/day
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        car.available 
                          ? 'bg-success-50 text-success-500' 
                          : 'bg-error-50 text-error-500'
                      }`}>
                        {car.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCar(car)}
                          leftIcon={<Edit size={16} />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={car.available ? 'error' : 'success'}
                          size="sm"
                          onClick={() => handleToggleAvailability(car.id, !car.available)}
                          leftIcon={car.available ? <X size={16} /> : <Check size={16} />}
                        >
                          {car.available ? 'Disable' : 'Enable'}
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
      
      {/* Add/Edit Car Modal */}
      {(isAddingCar || editingCar) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                {isAddingCar ? 'Add New Car' : 'Edit Car'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Make"
                  value={editingCar?.make || newCar.make}
                  onChange={(e) => editingCar 
                    ? setEditingCar({ ...editingCar, make: e.target.value })
                    : setNewCar({ ...newCar, make: e.target.value })
                  }
                />
                
                <Input
                  label="Model"
                  value={editingCar?.model || newCar.model}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, model: e.target.value })
                    : setNewCar({ ...newCar, model: e.target.value })
                  }
                />
                
                <Input
                  label="Year"
                  type="number"
                  value={editingCar?.year || newCar.year}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, year: parseInt(e.target.value) })
                    : setNewCar({ ...newCar, year: parseInt(e.target.value) })
                  }
                />
                
                <Input
                  label="Price per Day"
                  type="number"
                  value={editingCar?.price_per_day || newCar.price_per_day}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, price_per_day: parseFloat(e.target.value) })
                    : setNewCar({ ...newCar, price_per_day: parseFloat(e.target.value) })
                  }
                />
                
                <Select
                  label="Category"
                  options={[
                    { value: 'luxury', label: 'Luxury' },
                    { value: 'sports', label: 'Sports' },
                    { value: 'suv', label: 'SUV' },
                    { value: 'sedan', label: 'Sedan' },
                    { value: 'convertible', label: 'Convertible' },
                    { value: 'electric', label: 'Electric' },
                  ]}
                  value={editingCar?.category || newCar.category}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, category: e.target.value })
                    : setNewCar({ ...newCar, category: e.target.value })
                  }
                />
                
                <Input
                  label="Image URL"
                  value={editingCar?.image_url || newCar.image_url}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, image_url: e.target.value })
                    : setNewCar({ ...newCar, image_url: e.target.value })
                  }
                />

                <Input
                  label="Number of Seats"
                  type="number"
                  min="2"
                  max="8"
                  value={editingCar?.seats || newCar.seats}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, seats: parseInt(e.target.value) })
                    : setNewCar({ ...newCar, seats: parseInt(e.target.value) })
                  }
                />

                <Select
                  label="Transmission"
                  options={[
                    { value: 'Automatic', label: 'Automatic' },
                    { value: 'Manual', label: 'Manual' },
                    { value: 'Semi-Automatic', label: 'Semi-Automatic' },
                  ]}
                  value={editingCar?.transmission || newCar.transmission}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, transmission: e.target.value })
                    : setNewCar({ ...newCar, transmission: e.target.value })
                  }
                />

                <Select
                  label="Mileage Type"
                  options={[
                    { value: 'Unlimited', label: 'Unlimited' },
                    { value: '150 miles/day', label: '150 miles/day' },
                    { value: '200 miles/day', label: '200 miles/day' },
                    { value: '300 miles/day', label: '300 miles/day' },
                  ]}
                  value={editingCar?.mileage_type || newCar.mileage_type}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, mileage_type: e.target.value })
                    : setNewCar({ ...newCar, mileage_type: e.target.value })
                  }
                />
                
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={editingCar?.description || newCar.description}
                    onChange={(e) => editingCar
                      ? setEditingCar({ ...editingCar, description: e.target.value })
                      : setNewCar({ ...newCar, description: e.target.value })
                    }
                  />
                </div>
                
                {/* Features Section */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold">Features</h3>
                  
                  {/* Common Features */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {COMMON_FEATURES.map((feature) => {
                      const isSelected = (editingCar?.features || newCar.features).includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => handleToggleCommonFeature(feature)}
                          className={`p-2 rounded-md text-sm flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary-100 text-primary-800 border-primary-300'
                              : 'bg-secondary-50 text-secondary-700 border-secondary-200'
                          } border hover:bg-opacity-80 transition-colors`}
                        >
                          <span>{feature}</span>
                          {isSelected && <Check size={16} className="ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom Feature Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom feature..."
                      value={customFeature}
                      onChange={(e) => setCustomFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    />
                    <Button
                      type="button"
                      onClick={handleAddFeature}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Selected Features */}
                  <div className="flex flex-wrap gap-2">
                    {(editingCar?.features || newCar.features).map((feature) => (
                      <span
                        key={feature}
                        className="bg-primary-50 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(feature)}
                          className="ml-2 hover:text-error-500"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingCar(false);
                    setEditingCar(null);
                    setCustomFeature('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => editingCar ? handleUpdateCar(editingCar) : handleAddCar()}
                >
                  {editingCar ? 'Update Car' : 'Add Car'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCars;