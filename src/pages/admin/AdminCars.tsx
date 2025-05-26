import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminStore } from '../../stores/adminStore';
import type { Car } from '../../types';

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
  
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price_per_day: 0,
    category: '',
    image_url: '',
    description: '',
    features: [] as string[],
  });
  
  useEffect(() => {
    fetchAllCars();
  }, [fetchAllCars]);
  
  const handleAddCar = async () => {
    try {
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
      });
      toast.success('Car added successfully');
    } catch (error) {
      toast.error('Failed to add car');
    }
  };
  
  const handleUpdateCar = async (car: Car) => {
    try {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingCar(false);
                    setEditingCar(null);
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