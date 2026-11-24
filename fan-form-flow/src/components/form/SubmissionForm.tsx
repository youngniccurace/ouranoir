
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type FormData as ApplicationFormData } from '@/types/form';
import { Button } from '@/components/ui/button';
import type { FieldErrors } from '@/lib/validation';
import FieldError from './FieldError';
import Turnstile from './Turnstile';

// Props interface for the SubmissionForm component
interface SubmissionFormProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  isSubmitting: boolean;
  errors: FieldErrors;
  onTurnstileToken: (token: string) => void;
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
  isSubmitting,
  errors,
  onTurnstileToken
}: SubmissionFormProps) => {
  return (
    <div className="space-y-6">
      {/* Application Summary Section */}
      <div className="rounded-lg bg-primary/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Application Summary</h2>
        
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
            className="h-5 w-5 mt-0.5"
            aria-invalid={errors.agreeTerms ? true : undefined}
            aria-describedby={errors.agreeTerms ? 'agreeTerms-error' : undefined}
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => 
              updateFormData({ agreeTerms: checked === true })
            }
          />
          <div>
          <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
            I confirm that I am at least 18 years of age and I agree to the{" "}
            <a href="../terms.html" target="_blank" rel="noopener" className="text-primary font-semibold underline">Terms &amp; Conditions<span className="sr-only"> (opens in a new tab)</span></a>{" "}
            and{" "}
            <a href="../privacy.html" target="_blank" rel="noopener" className="text-primary font-semibold underline">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></a>.
          </Label>
            <FieldError id="agreeTerms" message={errors.agreeTerms} />
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="agreeContact" 
            className="h-5 w-5 mt-0.5"
            aria-invalid={errors.agreeContact ? true : undefined}
            aria-describedby={errors.agreeContact ? 'agreeContact-error' : undefined}
            checked={formData.agreeContact}
            onCheckedChange={(checked) => 
              updateFormData({ agreeContact: checked === true })
            }
          />
          <div>
          <Label htmlFor="agreeContact" className="text-sm leading-relaxed">
            I consent to being contacted by the agency team regarding my application and opportunities via email, phone, or message.
          </Label>
            <FieldError id="agreeContact" message={errors.agreeContact} />
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="confirmAccurate" 
            className="h-5 w-5 mt-0.5"
            aria-invalid={errors.confirmAccurate ? true : undefined}
            aria-describedby={errors.confirmAccurate ? 'confirmAccurate-error' : undefined}
            checked={formData.confirmAccurate}
            onCheckedChange={(checked) => 
              updateFormData({ confirmAccurate: checked === true })
            }
          />
          <div>
          <Label htmlFor="confirmAccurate" className="text-sm leading-relaxed">
            I confirm that all information and materials provided in this application are accurate and authentic.
          </Label>
            <FieldError id="confirmAccurate" message={errors.confirmAccurate} />
          </div>
        </div>
      </div>
      
      {/* Spam protection: Cloudflare Turnstile (only when configured) */}
      <div>
        <Turnstile onToken={onTurnstileToken} />
        <FieldError id="turnstile" message={errors.turnstile} />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-[#050709] hover:text-[#D4A762] text-[#050709] shadow-lg py-6 text-lg font-bold rounded-full mt-2 transition-colors"
      >
        {isSubmitting ? "Submitting your application…" : "Submit My Application"}
      </Button>
    </div>
  );
};

export default SubmissionForm;
