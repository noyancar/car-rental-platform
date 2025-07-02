import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin, Building2, Plane, HelpCircle, DollarSign, Edit2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLocationStore } from '../../stores/locationStore';
import { Database } from '../../types/supabase';

type Location = Database['public']['Tables']['locations']['Row'];
type LocationCategory = 'base' | 'airport' | 'hotel' | 'custom';

const categoryIcons: Record<LocationCategory, React.ReactNode> = {
  base: <Building2 className="w-5 h-5" />,
  airport: <Plane className="w-5 h-5" />,
  hotel: <MapPin className="w-5 h-5" />,
  custom: <HelpCircle className="w-5 h-5" />
};

const categoryLabels: Record<LocationCategory, string> = {
  base: 'Base Office',
  airport: 'Airport',
  hotel: 'Premium Hotels',
  custom: 'Custom Location'
};

interface EditableLocation extends Location {
  isEditing?: boolean;
  tempFee?: number;
  tempLabel?: string;
}

const LocationManagement: React.FC = () => {
  const { locations: dbLocations, loading, fetchLocations, addLocation, updateLocation, deleteLocation } = useLocationStore();
  const [locations, setLocations] = useState<EditableLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    value: '',
    label: '',
    address: '',
    delivery_fee: 0,
    category: 'hotel' as LocationCategory
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load locations from database on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Update local state when database locations change
  useEffect(() => {
    setLocations(dbLocations.map(loc => ({ ...loc })));
  }, [dbLocations]);

  const handleEditStart = (index: number) => {
    const updated = [...locations];
    updated[index] = {
      ...updated[index],
      isEditing: true,
      tempFee: updated[index].delivery_fee,
      tempLabel: updated[index].label
    };
    setLocations(updated);
  };

  const handleEditCancel = (index: number) => {
    const updated = [...locations];
    updated[index] = {
      ...updated[index],
      isEditing: false,
      tempFee: undefined,
      tempLabel: undefined
    };
    setLocations(updated);
  };

  const handleEditSave = async (index: number) => {
    const location = locations[index];
    
    if (location.tempFee !== undefined && location.tempLabel !== undefined) {
      setIsSaving(true);
      const success = await updateLocation(location.id, {
        delivery_fee: location.tempFee,
        label: location.tempLabel
      });
      
      if (success) {
        toast.success('Location updated successfully');
        handleEditCancel(index);
      } else {
        toast.error('Failed to update location');
      }
      setIsSaving(false);
    }
  };

  const handleFeeChange = (index: number, fee: number) => {
    const updated = [...locations];
    if (updated[index].isEditing) {
      updated[index].tempFee = fee;
    }
    setLocations(updated);
  };

  const handleLabelChange = (index: number, label: string) => {
    const updated = [...locations];
    if (updated[index].isEditing) {
      updated[index].tempLabel = label;
    }
    setLocations(updated);
  };

  const handleDeleteLocation = async (location: Location) => {
    if (location.category === 'base') {
      toast.error('Cannot delete base office location');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${location.label}"?`)) {
      setIsSaving(true);
      const success = await deleteLocation(location.id);
      
      if (success) {
        toast.success('Location deleted successfully');
      } else {
        toast.error('Failed to delete location');
      }
      setIsSaving(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.value || !newLocation.label || !newLocation.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    const locationToAdd = {
      value: newLocation.value.toLowerCase().replace(/\s+/g, '-'),
      label: newLocation.label,
      address: newLocation.address,
      delivery_fee: newLocation.delivery_fee,
      category: newLocation.category,
      is_active: true,
      sort_order: dbLocations.length + 1
    };

    const result = await addLocation(locationToAdd);
    
    if (result) {
      toast.success('Location added successfully');
      setNewLocation({
        value: '',
        label: '',
        address: '',
        delivery_fee: 0,
        category: 'hotel' as LocationCategory
      });
      setShowAddForm(false);
    } else {
      toast.error('Failed to add location');
    }
    setIsSaving(false);
  };

  const handleRefresh = () => {
    fetchLocations();
    toast.success('Locations refreshed');
  };

  // Group locations by category
  const groupedLocations = locations.reduce((acc, location, index) => {
    const category = location.category as LocationCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...location, originalIndex: index });
    return acc;
  }, {} as Record<LocationCategory, (EditableLocation & { originalIndex: number })[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Location Management</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How Delivery Fees Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Base office pickups and returns are always free</li>
            <li>• For the same pickup and return location: Full fee is charged once</li>
            <li>• For different pickup and return locations: Average of both fees is charged</li>
            <li>• Custom locations require a quote from your team</li>
          </ul>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-medium mb-4">Add New Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <Input
                value={newLocation.label}
                onChange={(e) => setNewLocation({ ...newLocation, label: e.target.value })}
                placeholder="e.g., Ala Moana Hotel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location ID
              </label>
              <Input
                value={newLocation.value}
                onChange={(e) => setNewLocation({ ...newLocation, value: e.target.value })}
                placeholder="e.g., ala-moana-hotel"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newLocation.category}
                onChange={(e) => setNewLocation({ ...newLocation, category: e.target.value as LocationCategory })}
              >
                <option value="hotel">Hotel</option>
                <option value="airport">Airport</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Fee
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={newLocation.delivery_fee}
                  onChange={(e) => setNewLocation({ ...newLocation, delivery_fee: parseInt(e.target.value) || 0 })}
                  className="pl-10"
                  min="0"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddLocation}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading locations...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedLocations) as [LocationCategory, (EditableLocation & { originalIndex: number })[]][]).map(([category, categoryLocations]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{categoryIcons[category]}</span>
                  <h3 className="text-lg font-medium text-gray-900">{categoryLabels[category]}</h3>
                  <span className="text-sm text-gray-500">({categoryLocations.length})</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {categoryLocations.map((location) => (
                  <div key={location.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {location.isEditing ? (
                          <Input
                            value={location.tempLabel}
                            onChange={(e) => handleLabelChange(location.originalIndex, e.target.value)}
                            className="mb-2"
                          />
                        ) : (
                          <h4 className="font-medium text-gray-900">{location.label}</h4>
                        )}
                        <p className="text-sm text-gray-500">{location.address}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Fee:</span>
                          {location.isEditing ? (
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                type="number"
                                value={location.tempFee}
                                onChange={(e) => handleFeeChange(location.originalIndex, parseInt(e.target.value) || 0)}
                                className="w-24 pl-10"
                                min="0"
                              />
                            </div>
                          ) : (
                            <span className="font-medium text-gray-900">
                              ${location.delivery_fee}
                              {location.delivery_fee === -1 && ' (Quote)'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {location.isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleEditSave(location.originalIndex)}
                                disabled={isSaving}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEditCancel(location.originalIndex)}
                                disabled={isSaving}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEditStart(location.originalIndex)}
                                disabled={location.category === 'base'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDeleteLocation(location)}
                                disabled={location.category === 'base' || isSaving}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationManagement;