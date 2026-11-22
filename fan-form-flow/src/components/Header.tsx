import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn("w-full py-3 text-center", className)}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-[#050709] focus:text-white focus:px-4 focus:py-2 focus:rounded">
        Skip to form
      </a>
      <div className="container mx-auto px-4">
        <a href="../index.html" className="inline-flex items-center min-h-[44px] mb-1 text-3xl text-primary font-playball" aria-label="OuraNoir home">
          Oura<span className="text-dark">Noir</span>
        </a>
        <h1 className="text-3xl md:text-4xl font-normal text-dark font-playball">
          Apply to Join <span className="text-[#A97A31]">OuraNoir</span>
        </h1>
        <p className="mt-1 text-secondary max-w-2xl mx-auto text-sm">
          Maximize your earning potential on OnlyFans with our exclusive management team. 18+ only &middot; Takes about 5 minutes.
        </p>
      </div>
    </header>
  );
};

export default Header;
