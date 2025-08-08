import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Search, Tag, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SimpleImageUploader } from '../../components/ui/SimpleImageUploader';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminStore } from '../../stores/adminStore';
import { checkStorageSetup } from '../../utils/fixStorageSetup';
import { exportCarPerformanceCSV } from '../../utils/csvExport';
import type { Car } from '../../types/index';

const COMMON_FEATURES = [
  'Backup Camera',
  'Blind Spot Warning',
  'AUX Input',
  'Android Auto',
  'Apple CarPlay',
  'Bluetooth',
  'USB Charger',
  'USB Input',
  'GPS',
  'Heated Seats',
  'Sunroof',
  'Adaptive Cruise Control',
  'Brake Assist',
  'Lane Departure Warning',
  'Lane Keeping Assist',
  'All-wheel Drive',
  'Convertible'
];

const AdminCars: React.FC = () => {
  const { 
    allCars, 
    allBookings,
    loading, 
    error,
    fetchAllCars,
    fetchAllBookings,
    addCar,
    updateCar,
    toggleCarAvailability,
    deleteCar
  } = useAdminStore();
  
  // Restore modal state from sessionStorage
  const [isAddingCar, setIsAddingCar] = useState(() => {
    const saved = sessionStorage.getItem('adminCarsModalOpen');
    return saved === 'true';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingCar, setEditingCar] = useState<Car | null>(() => {
    const saved = sessionStorage.getItem('adminCarsEditingCar');
    return saved ? JSON.parse(saved) : null;
  });
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    // If modal was open, we're not in initial load
    return sessionStorage.getItem('adminCarsModalOpen') !== 'true';
  });
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState('');
  
  const [newCar, setNewCar] = useState(() => {
    const saved = sessionStorage.getItem('adminCarsNewCar');
    return saved ? JSON.parse(saved) : {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price_per_day: 0,
    category: '',
    image_url: '',
    image_urls: [] as string[],
    main_image_index: 0,
    description: '',
    features: [] as string[],
    seats: 5,
    transmission: 'Automatic',
    mileage_type: 'Unlimited',
    available: true,
    trim: '',
    color: '',
    license_plate: '',
    doors: 4,
    fuel_type: 'Gas',
    gas_grade: 'Regular',
  };
  });
  
  // Track modal state changes in sessionStorage
  useEffect(() => {
    sessionStorage.setItem('adminCarsModalOpen', isAddingCar.toString());
  }, [isAddingCar]);
  
  useEffect(() => {
    sessionStorage.setItem('adminCarsEditingCar', editingCar ? JSON.stringify(editingCar) : '');
  }, [editingCar]);
  
  // Save newCar state to sessionStorage
  useEffect(() => {
    if (isAddingCar) {
      sessionStorage.setItem('adminCarsNewCar', JSON.stringify(newCar));
    }
  }, [newCar, isAddingCar]);
  
  useEffect(() => {
    setIsInitialLoad(false);
    fetchAllCars();
    fetchAllBookings();
  }, []); // Only on mount - simple and clean

  const handleExportPerformance = () => {
    try {
      exportCarPerformanceCSV(allCars, allBookings);
      toast.success('Car performance report exported successfully');
    } catch (error) {
      toast.error('Failed to export car performance report');
    }
  };
  
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
      sessionStorage.removeItem('adminCarsModalOpen');
      sessionStorage.removeItem('adminCarsNewCar');
      setNewCar({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        price_per_day: 0,
        category: '',
        image_url: '',
        image_urls: [],
        main_image_index: 0,
        description: '',
        features: [],
        seats: 5,
        transmission: 'Automatic',
        mileage_type: 'Unlimited',
        available: true,
        trim: '',
        color: '',
        license_plate: '',
        doors: 4,
        fuel_type: 'Gas',
        gas_grade: 'Regular',
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
      
      // Updating car with image data
      
      await updateCar(car.id, car);
      setEditingCar(null);
      sessionStorage.removeItem('adminCarsEditingCar');
      toast.success('Car updated successfully');
    } catch (error) {
      toast.error('Failed to update car');
    }
  };
  
  const handleToggleAvailability = async (id: string, available: boolean) => {
    try {
      await toggleCarAvailability(id, available);
      toast.success(`Car ${available ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update car availability');
    }
  };
  
  const handleDeleteCar = async (car: Car) => {
    if (!confirm(`Are you sure you want to delete "${car.make} ${car.model}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    const success = await deleteCar(car.id);
    
    if (success) {
      toast.success('Car deleted successfully');
    } else {
      toast.error(error || 'Failed to delete car. It may have active bookings.');
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
  
  // Check if modal should be restored BEFORE showing loading
  const shouldShowModal = isAddingCar || editingCar || sessionStorage.getItem('adminCarsModalOpen') === 'true';
  
  // Never show loading if modal should be displayed
  if (loading && !shouldShowModal && allCars.length === 0) {
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
  
  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Admin', path: '/admin' },
    { label: 'Cars', path: '/admin/cars' }
  ];

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <PageHeader
          title="Manage Cars"
          subtitle="Add, edit, and manage your car inventory"
          breadcrumbItems={breadcrumbItems}
          fallbackPath="/admin"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPerformance}
                leftIcon={<Download size={20} />}
              >
                Export Performance
              </Button>
              <Button 
                variant="primary"
                onClick={() => setIsAddingCar(true)}
                leftIcon={<Plus size={20} />}
              >
                Add New Car
              </Button>
            </div>
          }
        />
        
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">License Plate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Price/Day</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Fuel</th>
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
                          src={car.image_urls?.length ? car.image_urls[car.main_image_index || 0] : car.image_url} 
                          alt={`${car.make} ${car.model}`}
                          className="h-12 w-16 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="font-medium">{car.make} {car.model} {car.trim || ''}</div>
                          <div className="text-sm text-secondary-500">{car.year} • {car.color || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{car.license_plate || 'N/A'}</span>
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
                      <div className="text-sm">
                        <div>{car.fuel_type || 'Gas'}</div>
                        <div className="text-secondary-500">{car.gas_grade || 'Regular'}</div>
                      </div>
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
                          variant={car.available ? 'outline' : 'primary'}
                          size="sm"
                          className={car.available ? "text-error-500 border-error-500 hover:bg-error-50" : "bg-primary-600"}
                          onClick={() => handleToggleAvailability(car.id, !car.available)}
                          leftIcon={car.available ? <X size={16} /> : <Check size={16} />}
                        >
                          {car.available ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error-500 border-error-500 hover:bg-error-50"
                          onClick={() => handleDeleteCar(car)}
                          leftIcon={<Trash2 size={16} />}
                        >
                          Delete
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">
                {isAddingCar ? 'Add New Car' : 'Edit Car'}
              </h2>
              <button
                onClick={() => {
                  setIsAddingCar(false);
                  setEditingCar(null);
                  sessionStorage.removeItem('adminCarsModalOpen');
                  sessionStorage.removeItem('adminCarsEditingCar');
                  sessionStorage.removeItem('adminCarsNewCar');
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-all duration-200 group"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-secondary-600 group-hover:text-secondary-800" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              
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
                  label="Trim"
                  value={editingCar?.trim || newCar.trim}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, trim: e.target.value })
                    : setNewCar({ ...newCar, trim: e.target.value })
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
                  label="Color"
                  value={editingCar?.color || newCar.color}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, color: e.target.value })
                    : setNewCar({ ...newCar, color: e.target.value })
                  }
                />
                
                <Input
                  label="License Plate"
                  value={editingCar?.license_plate || newCar.license_plate}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, license_plate: e.target.value.toUpperCase() })
                    : setNewCar({ ...newCar, license_plate: e.target.value.toUpperCase() })
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
                      ]}
                  value={editingCar?.category || newCar.category}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, category: e.target.value })
                    : setNewCar({ ...newCar, category: e.target.value })
                  }
                />
                
                <Select
                  label="Number of Doors"
                  options={[
                    { value: '2', label: '2 Doors' },
                    { value: '4', label: '4 Doors' },
                    { value: '5', label: '5 Doors' },
                  ]}
                  value={editingCar?.doors?.toString() || newCar.doors.toString()}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, doors: parseInt(e.target.value) })
                    : setNewCar({ ...newCar, doors: parseInt(e.target.value) })
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
                  label="Fuel Type"
                  options={[
                    { value: 'Gas', label: 'Gas' },
                    { value: 'Electric', label: 'Electric' },
                    { value: 'Hybrid', label: 'Hybrid' },
                  ]}
                  value={editingCar?.fuel_type || newCar.fuel_type}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, fuel_type: e.target.value })
                    : setNewCar({ ...newCar, fuel_type: e.target.value })
                  }
                />
                
                <Select
                  label="Gas Grade"
                  options={[
                    { value: 'Regular', label: 'Regular' },
                    { value: 'Premium', label: 'Premium' },
                    { value: 'N/A', label: 'N/A' },
                  ]}
                  value={editingCar?.gas_grade || newCar.gas_grade}
                  onChange={(e) => editingCar
                    ? setEditingCar({ ...editingCar, gas_grade: e.target.value })
                    : setNewCar({ ...newCar, gas_grade: e.target.value })
                  }
                />
                
                <SimpleImageUploader
                  label="Araç Fotoğrafları"
                  initialImages={editingCar?.image_urls || (editingCar?.image_url ? [editingCar.image_url] : [])}
                  initialMainIndex={editingCar?.main_image_index || 0}
                  onImagesChange={(urls: string[], mainIndex: number) => {
                    if (editingCar) {
                      setEditingCar({ 
                        ...editingCar, 
                        image_urls: urls,
                        main_image_index: mainIndex,
                        // Legacy desteği
                        image_url: urls.length > 0 ? urls[mainIndex] : editingCar.image_url
                      });
                    } else {
                      setNewCar({ 
                        ...newCar, 
                        image_urls: urls,
                        main_image_index: mainIndex,
                        // Legacy desteği
                        image_url: urls.length > 0 ? urls[mainIndex] : ''
                      });
                    }
                  }}
                  bucketName="car-images"
                  folderPath="cars"
                  itemId={editingCar?.id}
                  maxFiles={5}
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
                    sessionStorage.removeItem('adminCarsModalOpen');
                    sessionStorage.removeItem('adminCarsEditingCar');
                    sessionStorage.removeItem('adminCarsNewCar');
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