
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';

interface SuccessMessageProps {
  onRestart?: () => void;
}

const SuccessMessage = ({ onRestart }: SuccessMessageProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Check size={40} className="text-primary" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        Application Submitted!
      </h2>
      
      <p className="text-gray-600 mb-6">
        Thank you for applying to join OuraNoir. We've received your application and will review it shortly. 
        Our team will be in touch with you via email within 2-3 business days.
      </p>
      
      <div className="bg-gray-50 p-4 rounded-lg w-full mb-6">
        <p className="text-sm text-gray-500">
          If you have any questions in the meantime, please contact us at{" "}
          <a href="mailto:talent@agency.com" className="text-primary hover:underline">
            talent@agency.com
          </a>
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Button
          variant="outline"
          className="flex-1 border-primary text-primary hover:bg-primary/5"
          onClick={() => { window.location.href = '../index.html'; }}
        >
          Back to OuraNoir
        </Button>
        
        <Button
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={onRestart}
        >
          Submit Another Application
        </Button>
      </div>
    </div>
  );
};

export default SuccessMessage;
