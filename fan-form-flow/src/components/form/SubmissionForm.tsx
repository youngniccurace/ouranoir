
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type FormData as ApplicationFormData } from '@/types/form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Props interface for the SubmissionForm component
interface SubmissionFormProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting: boolean;
}

/**
 * SubmissionForm Component
 * 
 * This component displays the final step of the application process where users:
 * - Review their application details
 * - Agree to terms and conditions
 * - Submit their application
 */
const SubmissionForm = ({ 
  formData, 
  updateFormData,
  onSubmit,
  isSubmitting
}: SubmissionFormProps) => {
  // Validate agreements, then let the parent component send the application
  const handleSubmit = () => {
    if (!formData.agreeTerms || !formData.agreeContact || !formData.confirmAccurate) {
      toast.error('Please agree to all terms to submit');
      return;
    }
    onSubmit();
  };
  
  return (
    <div className="space-y-6">
      {/* Application Summary Section */}
      <div className="rounded-lg bg-primary/10 p-6">
        <h3 className="text-lg font-medium mb-4">Application Summary</h3>
        
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Name:</p>
              <p>{formData.firstName} {formData.lastName}</p>
            </div>
            
            {formData.stageName && (
              <div>
                <p className="font-medium">Stage Name:</p>
                <p>{formData.stageName}</p>
              </div>
            )}
            
            <div>
              <p className="font-medium">Email:</p>
              <p>{formData.email}</p>
            </div>
            
            <div>
              <p className="font-medium">Phone:</p>
              <p>{formData.phone}</p>
            </div>
            
            <div>
              <p className="font-medium">Location:</p>
              <p>{formData.location}</p>
            </div>
            
            <div>
              <p className="font-medium">Experience Level:</p>
              <p className="capitalize">{formData.experienceLevel}</p>
            </div>
            
            <div>
              <p className="font-medium">Content Types:</p>
              <p>{formData.contentTypes.join(", ") || "None selected"}</p>
            </div>
            
            <div>
              <p className="font-medium">Weekly Availability:</p>
              <p>{formData.availability} hours</p>
            </div>
          </div>
          
          <div>
            <p className="font-medium">About:</p>
            <p className="line-clamp-2">{formData.aboutYou}</p>
          </div>
          
          <div>
            <p className="font-medium">Social Media:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
              {formData.instagram && <p>Instagram: {formData.instagram}</p>}
              {formData.twitter && <p>Twitter: {formData.twitter}</p>}
              {formData.tiktok && <p>TikTok: {formData.tiktok}</p>}
              {formData.onlyfans && <p>OnlyFans: {formData.onlyfans}</p>}
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms and Agreements */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="agreeTerms" 
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => 
              updateFormData({ agreeTerms: checked === true })
            }
          />
          <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
            I confirm that I am at least 18 years of age and I agree to the{" "}
            <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>.
          </Label>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="agreeContact" 
            checked={formData.agreeContact}
            onCheckedChange={(checked) => 
              updateFormData({ agreeContact: checked === true })
            }
          />
          <Label htmlFor="agreeContact" className="text-sm leading-relaxed">
            I consent to being contacted by the agency team regarding my application and opportunities via email, phone, or message.
          </Label>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="confirmAccurate" 
            checked={formData.confirmAccurate}
            onCheckedChange={(checked) => 
              updateFormData({ confirmAccurate: checked === true })
            }
          />
          <Label htmlFor="confirmAccurate" className="text-sm leading-relaxed">
            I confirm that all information and materials provided in this application are accurate and authentic.
          </Label>
        </div>
      </div>
      
      {/* Submit Button - Made more visible with brand colors */}
      <Button
        onClick={handleSubmit}
        disabled={!formData.agreeTerms || !formData.agreeContact || !formData.confirmAccurate || isSubmitting}
        className="w-full bg-primary hover:bg-primary/80 text-white shadow-lg py-6 text-lg font-bold rounded-md mt-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl border-2 border-primary/20"
      >
        {isSubmitting ? "Submitting..." : "SUBMIT APPLICATION"}
      </Button>
    </div>
  );
};

export default SubmissionForm;
