
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';

interface SuccessMessageProps {
  onRestart?: () => void;
}

const SuccessMessage = ({ onRestart }: SuccessMessageProps) => {
  const contactEmail = window.OURANOIR_CONFIG?.contactEmail || 'hello@example.com';
  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center">
      <div aria-hidden="true" className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Check size={40} className="text-[#8F6526]" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" tabIndex={-1} ref={(el) => el?.focus()}>
        Application Submitted!
      </h2>
      
      <p className="text-gray-600 mb-6">
        Thank you for applying to join OuraNoir. We've received your application and will review it shortly. 
        Our team will be in touch with you via email within 2-3 business days.
      </p>
      
      <div className="bg-gray-50 p-4 rounded-lg w-full mb-6">
        <p className="text-sm text-gray-600">
          If you have any questions in the meantime, please contact us at{" "}
          <a href={`mailto:${contactEmail}`} className="text-primary font-semibold underline">
            {contactEmail}
          </a>
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Button
          variant="outline"
          className="flex-1 min-h-[44px] rounded-full border-[#8F6526] text-[#8F6526] hover:bg-primary/10"
          onClick={() => { window.location.href = '../index.html'; }}
        >
          Back to OuraNoir
        </Button>
        
        <Button
          className="flex-1 min-h-[44px] rounded-full bg-primary text-[#050709] font-bold hover:bg-[#050709] hover:text-[#D4A762]"
          onClick={onRestart}
        >
          Submit Another Application
        </Button>
      </div>
    </div>
  );
};

export default SuccessMessage;
