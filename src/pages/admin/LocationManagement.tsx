import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin, Building2, Plane, HelpCircle, DollarSign, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DEFAULT_LOCATIONS_LIST as INITIAL_LOCATIONS, type Location, type LocationCategory } from '../../constants/locations';

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
  const [locations, setLocations] = useState<EditableLocation[]>(INITIAL_LOCATIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    value: '',
    label: '',
    address: '',
    fee: 0,
    category: 'hotel' as LocationCategory
  });

  // Load locations from localStorage on mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('adminLocations');
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        setLocations(parsed);
      } catch (error) {
        console.error('Error loading saved locations:', error);
      }
    }
  }, []);

  const handleEditStart = (index: number) => {
    const updated = [...locations];
    updated[index] = {
      ...updated[index],
      isEditing: true,
      tempFee: updated[index].fee,
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

  const handleEditSave = (index: number) => {
    const updated = [...locations];
    const location = updated[index];
    
    if (location.tempFee !== undefined && location.tempLabel !== undefined) {
      updated[index] = {
        ...location,
        fee: location.tempFee,
        label: location.tempLabel,
        isEditing: false,
        tempFee: undefined,
        tempLabel: undefined
      };
      setLocations(updated);
      setHasChanges(true);
    }
  };

  const handleFeeChange = (index: number, fee: number) => {
    const updated = [...locations];
    if (updated[index].isEditing) {
      updated[index].tempFee = fee;
    } else {
      updated[index].fee = fee;
      setHasChanges(true);
    }
    setLocations(updated);
  };

  const handleLabelChange = (index: number, label: string) => {
    const updated = [...locations];
    if (updated[index].isEditing) {
      updated[index].tempLabel = label;
    } else {
      updated[index].label = label;
      setHasChanges(true);
    }
    setLocations(updated);
  };

  const handleDeleteLocation = (index: number) => {
    const location = locations[index];
    if (location.category === 'base') {
      toast.error('Cannot delete base office location');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${location.label}"?`)) {
      const updated = locations.filter((_, i) => i !== index);
      setLocations(updated);
      setHasChanges(true);
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.value || !newLocation.label) {
      toast.error('Please fill in all required fields');
      return;
    }

    const locationToAdd: Location = {
      value: newLocation.value.toLowerCase().replace(/\s+/g, '-'),
      label: newLocation.label,
      address: newLocation.address,
      fee: newLocation.fee,
      category: newLocation.category
    };

    setLocations([...locations, locationToAdd]);
    setNewLocation({
      value: '',
      label: '',
      address: '',
      fee: 0,
      category: 'hotel'
    });
    setShowAddForm(false);
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    try {
      // In a real app, this would be an API call
      localStorage.setItem('adminLocations', JSON.stringify(locations));
      
      // Also update the runtime locations (in a real app, this would trigger a global state update)
      localStorage.setItem('currentLocations', JSON.stringify(locations));
      
      setHasChanges(false);
      toast.success('Location settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save location settings');
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all locations to default values? This will lose all your custom changes.')) {
      setLocations(INITIAL_LOCATIONS);
      localStorage.removeItem('adminLocations');
      setHasChanges(true);
      toast.success('Locations reset to defaults');
    }
  };

  const groupedLocations = locations.reduce((acc, location, index) => {
    if (!acc[location.category]) {
      acc[location.category] = [];
    }
    acc[location.category].push({ ...location, originalIndex: index });
    return acc;
  }, {} as Record<LocationCategory, Array<EditableLocation & { originalIndex: number }>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-1">Manage pickup and return locations and their delivery fees</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            leftIcon={<Plus size={16} />}
          >
            Add Location
          </Button>
          {hasChanges && (
            <Button
              variant="primary"
              onClick={handleSaveAll}
              leftIcon={<Save size={16} />}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Add Location Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Location Name *"
              value={newLocation.label}
              onChange={(e) => setNewLocation({ ...newLocation, label: e.target.value })}
              placeholder="e.g., Marriott Waikiki Beach"
            />
            <Input
              label="Location Key *"
              value={newLocation.value}
              onChange={(e) => setNewLocation({ ...newLocation, value: e.target.value })}
              placeholder="e.g., marriott-waikiki-beach"
            />
            <Input
              label="Address"
              value={newLocation.address}
              onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              placeholder="Full address"
            />
            <Input
              label="Delivery Fee ($)"
              type="number"
              min="0"
              step="1"
              value={newLocation.fee}
              onChange={(e) => setNewLocation({ ...newLocation, fee: parseInt(e.target.value) || 0 })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newLocation.category}
                onChange={(e) => setNewLocation({ ...newLocation, category: e.target.value as LocationCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hotel">Premium Hotels</option>
                <option value="airport">Airport</option>
                <option value="custom">Custom Location</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddLocation}>Add Location</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Locations by Category */}
      {Object.entries(groupedLocations).map(([category, categoryLocations]) => (
        <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {categoryIcons[category as LocationCategory]}
              <h2 className="text-lg font-semibold text-gray-900">
                {categoryLabels[category as LocationCategory]}
              </h2>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                {categoryLocations.length} locations
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categoryLocations.map((location) => (
              <div key={location.originalIndex} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {location.isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <Input
                          label="Location Name"
                          value={location.tempLabel || ''}
                          onChange={(e) => handleLabelChange(location.originalIndex, e.target.value)}
                        />
                        <Input
                          label="Delivery Fee ($)"
                          type="number"
                          min="-1"
                          step="1"
                          value={location.tempFee || 0}
                          onChange={(e) => handleFeeChange(location.originalIndex, parseInt(e.target.value) || 0)}
                          placeholder="Enter -1 for quote required"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{location.label}</h3>
                        {location.address && (
                          <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium">
                              {location.fee === -1 ? (
                                <span className="text-orange-600">Quote Required</span>
                              ) : location.fee === 0 ? (
                                <span className="text-green-600">Free</span>
                              ) : (
                                <span>${location.fee} delivery fee</span>
                              )}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">Key: {location.value}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {location.isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(location.originalIndex)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCancel(location.originalIndex)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(location.originalIndex)}
                          leftIcon={<Edit2 size={14} />}
                        >
                          Edit
                        </Button>
                        {location.category !== 'base' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLocation(location.originalIndex)}
                            leftIcon={<Trash2 size={14} />}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fee Calculation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How Delivery Fees Work</h3>
        <div className="space-y-2 text-blue-800">
          <p><strong>Same Location:</strong> Full delivery fee applies (e.g., pickup and return at Hilton = $50)</p>
          <p><strong>Different Locations:</strong> Half fee for each location (e.g., pickup at Hilton $25 + return at Airport $35 = $60 total)</p>
          <p><strong>Base Office:</strong> Always free ($0 fee)</p>
          <p><strong>Custom Locations:</strong> Set fee to -1 to require a quote</p>
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;