
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
    <nav aria-label="Application progress" className={cn("w-full mb-5", className)}>
      <ol className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <li className="flex flex-col items-center" aria-current={index === currentStep ? 'step' : undefined}>
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm", 
                  index < currentStep ? "bg-primary text-[#050709]" : 
                  index === currentStep ? "bg-white border-2 border-primary text-[#8F6526]" : 
                  "bg-gray-100 text-gray-600"
                )}
              >
                {index < currentStep ? (
                  <Check size={18} />
                ) : (
                  getStepIcon(index)
                )}
              </div>
              <span aria-hidden="true"
                className={cn(
                  "text-xs mt-2 hidden md:block whitespace-nowrap", 
                  index <= currentStep ? "text-[#8F6526] font-semibold" : "text-gray-600"
                )}
              >
                {step}
              </span>
              <span className="sr-only">
                {`Step ${index + 1}: ${step}${index < currentStep ? ' (completed)' : index === currentStep ? ' (current)' : ''}`}
              </span>
            </li>
            
            {index < steps.length - 1 && (
              <li aria-hidden="true"
                className={cn(
                  "flex-1 h-1 mx-1", 
                  index < currentStep ? "bg-primary" : "bg-gray-200"
                )}
              ></li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default FormProgressBar;
