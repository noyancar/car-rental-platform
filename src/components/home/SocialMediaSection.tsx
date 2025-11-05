import React from 'react';
import { MetaPixel } from '../../utils/metaPixel';

import { Facebook as FacebookIcon, Instagram as InstagramIcon, Youtube as YoutubeIcon, LucideIcon } from 'lucide-react';

interface SocialLink {
  name: string;
  icon: LucideIcon;
  url: string;
  bgColor: string;
}

const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    name: 'Facebook',
    icon: FacebookIcon,
    url: 'https://www.facebook.com/people/NYN-Rentals/61580936472947/',
    bgColor: 'bg-[#1877F2]'
  },
  {
    name: 'Instagram',
    icon: InstagramIcon,
    url: 'https://www.instagram.com/nyn_rentals/',
    bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]'
  },
  {
    name: 'YouTube',
    icon: YoutubeIcon,
    url: 'https://www.youtube.com/@NYNRentals',
    bgColor: 'bg-[#FF0000]'
  }
] as const;

const SocialMediaSection: React.FC = () => {

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-b from-white to-secondary-50">
      <div className="container-custom">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-display mb-6 sm:mb-8">
            Follow Us on Social Media
          </h2>

          <div className="flex justify-center items-center gap-4 sm:gap-6">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  onClick={() => trackSocialMediaClick(social.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full ${social.bgColor} flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 active:shadow-sm`}
                  aria-label={`Follow us on ${social.name}`}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white transition-transform duration-300" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};


function trackSocialMediaClick(socialMediaName: string) {
  MetaPixel.track("SocialMediaClick", { platform: socialMediaName });
}

export default SocialMediaSection;
