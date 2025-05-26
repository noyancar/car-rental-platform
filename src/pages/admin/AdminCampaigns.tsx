import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Check, X, Search, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminStore } from '../../stores/adminStore';
import type { Campaign } from '../../types';

const AdminCampaigns: React.FC = () => {
  const { 
    campaigns, 
    loading, 
    error,
    fetchCampaigns,
    addCampaign,
    updateCampaign,
    toggleCampaignStatus
  } = useAdminStore();
  
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    discount_percentage: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date().toISOString().split('T')[0],
    featured_image_url: '',
    active: true,
  });
  
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);
  
  const handleAddCampaign = async () => {
    try {
      await addCampaign(newCampaign);
      setIsAddingCampaign(false);
      setNewCampaign({
        name: '',
        description: '',
        discount_percentage: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: new Date().toISOString().split('T')[0],
        featured_image_url: '',
        active: true,
      });
      toast.success('Campaign added successfully');
    } catch (error) {
      toast.error('Failed to add campaign');
    }
  };
  
  const handleUpdateCampaign = async (campaign: Campaign) => {
    try {
      await updateCampaign(campaign.id, campaign);
      setEditingCampaign(null);
      toast.success('Campaign updated successfully');
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };
  
  const handleToggleStatus = async (id: number, active: boolean) => {
    try {
      await toggleCampaignStatus(id, active);
      toast.success(`Campaign ${active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update campaign status');
    }
  };
  
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
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
          Error loading campaigns: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-800">
            Manage Campaigns
          </h1>
          <Button 
            variant="primary"
            onClick={() => setIsAddingCampaign(true)}
            leftIcon={<Plus size={20} />}
          >
            Add New Campaign
          </Button>
        </div>
        
        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={20} />}
          />
        </div>
        
        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative h-48">
                <img 
                  src={campaign.featured_image_url} 
                  alt={campaign.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    campaign.active 
                      ? 'bg-success-50 text-success-500' 
                      : 'bg-error-50 text-error-500'
                  }`}>
                    {campaign.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{campaign.name}</h3>
                <p className="text-secondary-600 mb-4">{campaign.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-secondary-600">
                    <span className="font-medium">Discount:</span>
                    <span className="ml-2">{campaign.discount_percentage}% OFF</span>
                  </div>
                  <div className="flex items-center text-secondary-600">
                    <span className="font-medium">Valid From:</span>
                    <span className="ml-2">{new Date(campaign.valid_from).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-secondary-600">
                    <span className="font-medium">Valid To:</span>
                    <span className="ml-2">{new Date(campaign.valid_to).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCampaign(campaign)}
                    leftIcon={<Edit size={16} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={campaign.active ? 'error' : 'success'}
                    size="sm"
                    onClick={() => handleToggleStatus(campaign.id, !campaign.active)}
                    leftIcon={campaign.active ? <X size={16} /> : <Check size={16} />}
                  >
                    {campaign.active ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      {(isAddingCampaign || editingCampaign) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                {isAddingCampaign ? 'Add New Campaign' : 'Edit Campaign'}
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Campaign Name"
                  value={editingCampaign?.name || newCampaign.name}
                  onChange={(e) => editingCampaign 
                    ? setEditingCampaign({ ...editingCampaign, name: e.target.value })
                    : setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  placeholder="Summer Sale 2025"
                />
                
                <Input
                  label="Description"
                  value={editingCampaign?.description || newCampaign.description}
                  onChange={(e) => editingCampaign
                    ? setEditingCampaign({ ...editingCampaign, description: e.target.value })
                    : setNewCampaign({ ...newCampaign, description: e.target.value })
                  }
                  placeholder="Get amazing discounts on luxury car rentals this summer"
                />
                
                <Input
                  label="Discount Percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={editingCampaign?.discount_percentage || newCampaign.discount_percentage}
                  onChange={(e) => editingCampaign
                    ? setEditingCampaign({ ...editingCampaign, discount_percentage: parseInt(e.target.value) })
                    : setNewCampaign({ ...newCampaign, discount_percentage: parseInt(e.target.value) })
                  }
                />
                
                <Input
                  label="Featured Image URL"
                  value={editingCampaign?.featured_image_url || newCampaign.featured_image_url}
                  onChange={(e) => editingCampaign
                    ? setEditingCampaign({ ...editingCampaign, featured_image_url: e.target.value })
                    : setNewCampaign({ ...newCampaign, featured_image_url: e.target.value })
                  }
                  placeholder="https://example.com/campaign-image.jpg"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Valid From"
                    type="date"
                    value={editingCampaign?.valid_from || newCampaign.valid_from}
                    onChange={(e) => editingCampaign
                      ? setEditingCampaign({ ...editingCampaign, valid_from: e.target.value })
                      : setNewCampaign({ ...newCampaign, valid_from: e.target.value })
                    }
                  />
                  
                  <Input
                    label="Valid To"
                    type="date"
                    value={editingCampaign?.valid_to || newCampaign.valid_to}
                    onChange={(e) => editingCampaign
                      ? setEditingCampaign({ ...editingCampaign, valid_to: e.target.value })
                      : setNewCampaign({ ...newCampaign, valid_to: e.target.value })
                    }
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingCampaign(false);
                    setEditingCampaign(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => editingCampaign ? handleUpdateCampaign(editingCampaign) : handleAddCampaign()}
                >
                  {editingCampaign ? 'Update Campaign' : 'Add Campaign'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns;