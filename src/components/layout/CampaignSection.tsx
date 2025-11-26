import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface CampaignConfig {
  enabled: boolean;
  message: string;
  discount: string;
  linkText: string;
  linkUrl: string;
  bgColor?: string;
  expiryDate?: string; // Format: "2024-12-31T23:59:59"
  showTimer?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}


const CampaignSection: React.FC = () => {
  // Campaign configurations - multiple campaigns with automatic rotation
  const campaigns: CampaignConfig[] = [
    {
      enabled: true,
      message: 'Discount on Selected Rentals! - Limited Time Offer.',
      discount: 'Black Friday Special Deals',
      linkText: 'View Deals',
      linkUrl: '/deals',
      bgColor: 'bg-gradient-to-r from-[#b20622ff] to-[#c51b37]',
      expiryDate: '2025-11-28T23:59:59',
      showTimer: true,
    },
    {
      enabled: true,
      message: 'Discount on Selected Rentals! - Limited Time Offer.',
      discount: 'Cyber Monday Special Deals',
      linkText: 'View Deals',
      linkUrl: '/deals',
      bgColor: 'bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6]',
      expiryDate: '2025-11-30T23:59:59',
      showTimer: true,
    },
    {
      enabled: true,
      message: 'Discount on Selected Rentals! - Limited Time Offer.',
      discount: 'Travel Tuesday Week Special Deals',
      linkText: 'View Deals',
      linkUrl: '/deals',
      bgColor: 'bg-gradient-to-r from-[#15803d] to-[#22c55e]',
      expiryDate: '2025-12-07T23:59:59',
      showTimer: true,
    },
  ];

  // Find the first active (not expired) campaign
  const getActiveCampaign = (): CampaignConfig | null => {
    const now = new Date().getTime();
    return campaigns.find(campaign => {
      if (!campaign.enabled) return false;
      if (!campaign.expiryDate) return true;
      return new Date(campaign.expiryDate).getTime() > now;
    }) || null;
  };

  const [activeCampaign, setActiveCampaign] = useState<CampaignConfig | null>(getActiveCampaign());
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Check for active campaign every second
    const checkActiveCampaign = () => {
      const newActiveCampaign = getActiveCampaign();
      setActiveCampaign(newActiveCampaign);
    };

    if (!activeCampaign?.expiryDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(activeCampaign.expiryDate!).getTime() - new Date().getTime();

      if (difference <= 0) {
        // Campaign expired, find next active campaign
        checkActiveCampaign();
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [activeCampaign?.expiryDate]);

  // Don't render if no active campaign
  if (!activeCampaign) {
    return null;
  }

  return (
    <section className={`relative w-full ${activeCampaign.bgColor} py-3 px-4 shadow-lg z-10`}>
      <div className="container-custom mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Campaign info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            <div className="flex items-center justify-center bg-white/20 rounded-full p-2">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            {/* Message */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-black uppercase tracking-wide" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1.25rem)' }}>
                  {activeCampaign.discount}
                </span>
              </div>
              <span className="text-white/95 font-medium" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 1rem)' }}>
                {activeCampaign.message}
              </span>
            </div>
          </div>

          {/* Right side: Countdown Timer */}
          {activeCampaign.showTimer && timeLeft && (
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                {timeLeft.days > 0 && (
                  <div className="flex flex-col items-center bg-white rounded-md sm:rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 min-w-[35px] sm:min-w-[45px] md:min-w-[60px] shadow-md">
                    <span className="text-sm sm:text-lg md:text-2xl font-black text-[#c51b37]">{timeLeft.days}</span>
                    <span className="text-[7px] sm:text-[8px] md:text-[10px] font-semibold text-gray-600 uppercase">Days</span>
                  </div>
                )}
                <div className="flex flex-col items-center bg-white rounded-md sm:rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 min-w-[35px] sm:min-w-[45px] md:min-w-[60px] shadow-md">
                  <span className="text-sm sm:text-lg md:text-2xl font-black text-[#c51b37]">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[7px] sm:text-[8px] md:text-[10px] font-semibold text-gray-600 uppercase">Hours</span>
                </div>
                <span className="text-white text-sm sm:text-lg md:text-2xl font-bold">:</span>
                <div className="flex flex-col items-center bg-white rounded-md sm:rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 min-w-[35px] sm:min-w-[45px] md:min-w-[60px] shadow-md">
                  <span className="text-sm sm:text-lg md:text-2xl font-black text-[#c51b37]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[7px] sm:text-[8px] md:text-[10px] font-semibold text-gray-600 uppercase">Mins</span>
                </div>
                <span className="text-white text-sm sm:text-lg md:text-2xl font-bold">:</span>
                <div className="flex flex-col items-center bg-white rounded-md sm:rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 min-w-[35px] sm:min-w-[45px] md:min-w-[60px] shadow-md">
                  <span className="text-sm sm:text-lg md:text-2xl font-black text-[#c51b37]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[7px] sm:text-[8px] md:text-[10px] font-semibold text-gray-600 uppercase">Secs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CampaignSection; 