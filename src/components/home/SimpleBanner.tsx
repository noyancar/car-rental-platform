import React from 'react';

interface SimpleBannerProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor?: string;
}

const SimpleBanner: React.FC<SimpleBannerProps> = ({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = '#1a1a1a',
}) => {
  return (
    <section
      className="w-full h-[25vh] flex items-center justify-center relative overflow-hidden shadow-xl"
      style={{
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay mask */}
      <div className="absolute inset-0 bg-black/50 z-[1]"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-3">
          {title}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 font-medium">
          {subtitle}
        </p>
      </div>
    </section>
  );
};

export default SimpleBanner;
