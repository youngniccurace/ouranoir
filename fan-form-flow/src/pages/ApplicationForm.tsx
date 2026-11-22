import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { FIELD_STEP, validateStep, type FieldErrors } from '@/lib/validation';

// PHP endpoint that receives the application. It is copied next to the built
// app (apply/process_form.php). Override with VITE_FORM_ENDPOINT if hosted elsewhere.
const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || 'process_form.php';

const STEPS = ['Personal', 'Social', 'Experience', 'Photos', 'Submit'];
const STEP_TITLES = [
  'Your personal details',
  'Your social media',
  'Your experience',
  'Photos and ID verification',
  'Review and submit',
];

/**
 * Multi-step application form.
 * Each step is validated before moving on (inline errors under each field);
 * the server re-validates everything and its field errors are mapped back here.
 */
const ApplicationForm = () => {
  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  // Form-level message (accessible live region instead of pop-up toasts)
  const [notice, setNotice] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const startedAt = useRef(Date.now());       // spam time trap
  const honeypot = useRef<HTMLInputElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const updateFormData = (data: Partial<ApplicationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for fields the user is changing
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(data).forEach((k) => delete next[k]);
      if ('idFile' in data) delete next.idFile;
      if ('photoFiles' in data) delete next.photos;
      return next;
    });
  };

  const setFieldError = useCallback((field: string, message?: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const onTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    if (token) setErrors((prev) => ({ ...prev, turnstile: undefined }));
  }, []);

  // Move focus to the step heading when the step changes (screen readers + keyboard users)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    stepHeading.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const focusFirstError = () => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.focus();
    });
  };

  const goToStep = (step: number) => setCurrentStep(step);

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      setNotice({ type: 'error', text: 'Please fix the highlighted fields below.' });
      focusFirstError();
      return;
    }
    setNotice(null);
    goToStep(Math.min(currentStep + 1, STEPS.length - 1));
  };

  const handlePrevious = () => { setNotice(null); goToStep(Math.max(currentStep - 1, 0)); };

  const handleSubmit = async () => {
    // Re-validate every step before anything is sent
    for (let step = 0; step < STEPS.length; step++) {
      const stepErrors = validateStep(step, formData);
      if (Object.keys(stepErrors).length) {
        setErrors((prev) => ({ ...prev, ...stepErrors }));
        goToStep(step);
        setNotice({ type: 'error', text: 'Please fix the highlighted fields below.' });
        focusFirstError();
        return;
      }
    }
    if (window.OURANOIR_CONFIG?.turnstileSiteKey && !turnstileToken) {
      setFieldError('turnstile', 'Please complete the security check.');
      return;
    }

    setIsSubmitting(true);
    const body = new FormData();
    const textFields: (keyof ApplicationData)[] = [
      'firstName', 'lastName', 'stageName', 'dateOfBirth', 'email', 'phone',
      'location', 'aboutYou', 'instagram', 'twitter', 'tiktok', 'onlyfans',
      'otherPlatforms', 'followersCount', 'experienceLevel', 'availability',
      'goalsOnPlatform',
    ];
    textFields.forEach((field) => body.append(field, String(formData[field] ?? '').trim()));
    body.append('contentTypes', formData.contentTypes.join(', '));
    body.append('agreeTerms', String(formData.agreeTerms));
    body.append('agreeContact', String(formData.agreeContact));
    body.append('confirmAccurate', String(formData.confirmAccurate));
    formData.photoFiles.forEach((file) => body.append('photos[]', file));
    if (formData.idFile) body.append('idDocument', formData.idFile);
    // Spam protection fields (see private/lib.php check_spam)
    body.append('website', honeypot.current?.value ?? '');
    body.append('form_started', String(startedAt.current));
    if (turnstileToken) body.append('cf-turnstile-response', turnstileToken);

    try {
      const response = await fetch(FORM_ENDPOINT, { method: 'POST', body, headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        const serverErrors: FieldErrors = result?.errors ?? {};
        if (Object.keys(serverErrors).length) {
          setErrors(serverErrors);
          const firstStep = Math.min(...Object.keys(serverErrors).map((f) => FIELD_STEP[f] ?? STEPS.length - 1));
          goToStep(firstStep);
          focusFirstError();
        }
        throw new Error(result?.message || `Server responded with ${response.status}`);
      }

      setIsSubmitted(true);
      window.ouranoirTrack?.('generate_lead', { form: 'application' });
      setNotice(null);
    } catch (error) {
      console.error('Error submitting application:', error);
      setNotice({
        type: 'error',
        text: error instanceof Error && error.message
          ? `Your application could not be submitted: ${error.message}`
          : 'Your application could not be submitted. Please try again later.',
      });
      window.turnstile?.reset();
      setTurnstileToken('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    formData.photoUrls.forEach((url) => URL.revokeObjectURL(url));
    setFormData(initialFormData);
    setErrors({});
    setCurrentStep(0);
    setIsSubmitted(false);
    startedAt.current = Date.now();
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < STEPS.length - 1) handleNext();
    else handleSubmit();
  };

  const renderFormStep = () => {
    const props = { formData, updateFormData, errors };
    switch (currentStep) {
      case 0: return <PersonalInfoForm {...props} />;
      case 1: return <SocialMediaForm {...props} />;
      case 2: return <ExperienceForm {...props} />;
      case 3: return <PhotosForm {...props} setFieldError={setFieldError} />;
      case 4: return <SubmissionForm {...props} isSubmitting={isSubmitting} onTurnstileToken={onTurnstileToken} />;
      default: return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-light">
        <Header />
        <main id="main" className="container mx-auto px-4 max-w-4xl flex-grow flex items-center justify-center py-6">
          <Card className="w-full overflow-hidden form-shadow">
            <CardContent className="p-6">
              <SuccessMessage onRestart={handleRestart} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-light">
      <Header />

      <main id="main" className="container mx-auto px-3 sm:px-4 py-4 max-w-4xl flex-grow">
        <Card className="w-full form-shadow">
          <CardContent className="p-4 md:p-6">
            <FormProgressBar steps={STEPS} currentStep={currentStep} />

            <form noValidate onSubmit={onFormSubmit} aria-labelledby="step-heading">
              <h2 id="step-heading" ref={stepHeading} tabIndex={-1} className="text-xl md:text-2xl mb-5 outline-none">
                <span className="sr-only">Step {currentStep + 1} of {STEPS.length}: </span>
                {STEP_TITLES[currentStep]}
              </h2>

              {/* Spam protection: honeypot field. Hidden from people and screen readers; bots fill it in. */}
              <div className="absolute -left-[10000px] w-px h-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input ref={honeypot} type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {renderFormStep()}

              <div aria-live="assertive" className="mt-6">
                {notice && (
                  <p role="alert" className="rounded-lg border-l-4 border-[#B02A37] bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#7A1D27]">
                    {notice.text}
                  </p>
                )}
              </div>

              <div className="flex justify-between gap-4 mt-4">
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="min-h-[44px] px-6 rounded-full border-[#8F6526] text-[#8F6526] hover:bg-primary/10"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length - 1 && (
                  <Button
                    type="submit"
                    className="min-h-[44px] bg-primary hover:bg-[#050709] hover:text-[#D4A762] text-[#050709] font-bold py-2 px-8 rounded-full"
                  >
                    Continue to {STEPS[currentStep + 1]}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ApplicationForm;
