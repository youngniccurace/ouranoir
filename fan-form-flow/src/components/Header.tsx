
import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn("w-full py-3 text-center", className)}>
      <div className="container mx-auto px-4">
        <a href="../index.html" className="inline-block mb-2 text-2xl font-bold text-primary font-sans">
          Oura<span className="text-dark">Noir</span>
        </a>
        <h1 className="text-3xl md:text-4xl font-normal text-dark font-playball">
          Join Our <span className="text-primary">Elite</span> Agency
        </h1>
        <p className="mt-1 text-secondary max-w-2xl mx-auto text-sm">
          Maximize your earning potential on OnlyFans with our exclusive management team.
        </p>
      </div>
    </header>
  );
};

export default Header;
