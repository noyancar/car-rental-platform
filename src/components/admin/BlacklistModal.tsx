import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BlacklistModalProps {
  isOpen: boolean;
  customerName: string;
  isBlacklisting: boolean; // true for blacklist, false for unblock
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

const BlacklistModal: React.FC<BlacklistModalProps> = ({
  isOpen,
  customerName,
  isBlacklisting,
  onConfirm,
  onClose
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isBlacklisting && !reason.trim()) {
      return;
    }
    onConfirm(isBlacklisting ? reason : undefined);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            {isBlacklisting ? 'Blacklist Customer' : 'Remove from Blacklist'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className={`p-4 rounded-lg mb-4 ${isBlacklisting ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-start">
            <AlertCircle className={`h-5 w-5 mt-0.5 mr-2 ${isBlacklisting ? 'text-red-500' : 'text-green-500'}`} />
            <div>
              <p className={`font-medium ${isBlacklisting ? 'text-red-800' : 'text-green-800'}`}>
                {isBlacklisting 
                  ? `Are you sure you want to blacklist ${customerName}?`
                  : `Are you sure you want to remove ${customerName} from the blacklist?`
                }
              </p>
              <p className={`text-sm mt-1 ${isBlacklisting ? 'text-red-600' : 'text-green-600'}`}>
                {isBlacklisting 
                  ? 'Blacklisted customers cannot make new bookings.'
                  : 'This customer will be able to make bookings again.'
                }
              </p>
            </div>
          </div>
        </div>

        {isBlacklisting && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for blacklisting <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason..."
              className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant={isBlacklisting ? "primary" : "primary"}
            onClick={handleConfirm}
            fullWidth
            disabled={isBlacklisting && !reason.trim()}
          >
            {isBlacklisting ? 'Blacklist Customer' : 'Remove from Blacklist'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlacklistModal;