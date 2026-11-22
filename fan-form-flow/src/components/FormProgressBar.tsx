
import React from 'react';
import { cn } from '@/lib/utils';
import { Check, User, Share2, Award, Image, FileCheck } from 'lucide-react';

interface FormProgressBarProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

const FormProgressBar = ({ steps, currentStep, className }: FormProgressBarProps) => {
  // Function to get the appropriate icon for each step
  const getStepIcon = (index: number) => {
    switch(index) {
      case 0: return <User size={16} />;
      case 1: return <Share2 size={16} />;
      case 2: return <Award size={16} />;
      case 3: return <Image size={16} />;
      case 4: return <FileCheck size={16} />;
      default: return <Check size={16} />;
    }
  };

  return (
    <div className={cn("w-full mb-5", className)}>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm", 
                  index < currentStep ? "bg-primary text-white" : 
                  index === currentStep ? "bg-white border-2 border-primary text-primary" : 
                  "bg-gray-100 text-gray-400"
                )}
              >
                {index < currentStep ? (
                  <Check size={18} />
                ) : (
                  getStepIcon(index)
                )}
              </div>
              <span 
                className={cn(
                  "text-xs mt-2 hidden md:block whitespace-nowrap", 
                  index <= currentStep ? "text-primary font-medium" : "text-gray-400"
                )}
              >
                {step}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "flex-1 h-1 mx-1", 
                  index < currentStep ? "bg-primary" : "bg-gray-200"
                )}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FormProgressBar;
