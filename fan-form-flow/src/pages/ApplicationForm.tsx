import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Header from '@/components/Header';
import FormProgressBar from '@/components/FormProgressBar';
import PersonalInfoForm from '@/components/form/PersonalInfoForm';
import SocialMediaForm from '@/components/form/SocialMediaForm';
import ExperienceForm from '@/components/form/ExperienceForm';
import PhotosForm from '@/components/form/PhotosForm';
import SubmissionForm from '@/components/form/SubmissionForm';
import SuccessMessage from '@/components/SuccessMessage';
import { initialFormData } from '@/types/form';
import type { FormData as ApplicationData } from '@/types/form';

// PHP endpoint that receives the application. It is copied next to the built
// app (apply/process_form.php). Override with VITE_FORM_ENDPOINT if hosted elsewhere.
const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || 'process_form.php';

/** Age in whole years for a YYYY-MM-DD date string */
const getAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * ApplicationForm Component
 * 
 * Multi-step form that collects information from users applying to join the agency.
 * The form is divided into sections for better user experience and data organization.
 */
const ApplicationForm = () => {
  // Main form state
  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Define form steps
  const steps = [
    "Personal",
    "Social",
    "Experience",
    "Photos",
    "Submit"
  ];
  
  // Update form data state
  const updateFormData = (data: Partial<ApplicationData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  // Handle next step button
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  
  // Handle previous step button
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  /**
   * Validate the current form step
   * Returns true if validation passes, false otherwise
   */
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Personal Info
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.email || !formData.phone) {
          toast.error('Please fill in all required fields');
          return false;
        }
        // Basic email validation
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        if (isNaN(getAge(formData.dateOfBirth)) || getAge(formData.dateOfBirth) < 18) {
          toast.error('You must be at least 18 years old to apply');
          return false;
        }
        return true;
        
      case 1: // Social Media
        // Social media is optional, so we'll just return true
        return true;
        
      case 2: // Experience
        if (!formData.experienceLevel || !formData.availability) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
        
      case 3: // Photos
        if (formData.photoFiles.length === 0) {
          toast.error('Please upload at least one photo');
          return false;
        }
        if (!formData.idFile) {
          toast.error('Please upload your ID for verification');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };
  
  /**
   * Form submission handler
   * Sends the application (including photos and ID) to the PHP backend.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    const body = new FormData();
    const textFields: (keyof ApplicationData)[] = [
      'firstName', 'lastName', 'stageName', 'dateOfBirth', 'email', 'phone',
      'location', 'aboutYou', 'instagram', 'twitter', 'tiktok', 'onlyfans',
      'otherPlatforms', 'followersCount', 'experienceLevel', 'availability',
      'goalsOnPlatform',
    ];
    textFields.forEach(field => body.append(field, String(formData[field] ?? '')));
    body.append('contentTypes', formData.contentTypes.join(', '));
    body.append('agreeTerms', String(formData.agreeTerms));
    body.append('agreeContact', String(formData.agreeContact));
    body.append('confirmAccurate', String(formData.confirmAccurate));
    formData.photoFiles.forEach(file => body.append('photos[]', file));
    if (formData.idFile) body.append('idDocument', formData.idFile);

    try {
      const response = await fetch(FORM_ENDPOINT, { method: 'POST', body });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Server responded with ${response.status}`);
      }

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(
        error instanceof Error && error.message
          ? `Could not submit application: ${error.message}`
          : 'Could not submit application. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Restart form after submission
  const handleRestart = () => {
    formData.photoUrls.forEach(url => URL.revokeObjectURL(url));
    setFormData(initialFormData);
    setCurrentStep(0);
    setIsSubmitted(false);
  };
  
  // Render the current form step
  const renderFormStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoForm formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <SocialMediaForm formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <ExperienceForm formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <PhotosForm formData={formData} updateFormData={updateFormData} />;
      case 4:
        return (
          <SubmissionForm 
            formData={formData} 
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };
  
  // Show success message after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-light">
        <Header />
        <div className="container mx-auto px-4 max-w-4xl flex-grow flex items-center justify-center">
          <Card className="w-full overflow-hidden form-shadow">
            <CardContent className="p-6">
              <SuccessMessage onRestart={handleRestart} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Main form render
  return (
    <div className="min-h-screen flex flex-col bg-light">
      <Header />
      
      <div className="container mx-auto px-4 py-4 max-w-4xl flex-grow">
        <Card className="w-full form-shadow">
          <CardContent className="p-4 md:p-6">
            <FormProgressBar steps={steps} currentStep={currentStep} />
            
            <ScrollArea className="h-[60vh] pr-4">
              {renderFormStep()}
            </ScrollArea>
            
            <div className="flex justify-between mt-6">
              {currentStep > 0 ? (
                <Button 
                  variant="outline"
                  onClick={handlePrevious}
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}
              
              {currentStep < steps.length - 1 && (
                <Button 
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationForm;
