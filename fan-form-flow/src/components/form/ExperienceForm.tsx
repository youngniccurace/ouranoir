import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormData } from '@/types/form';
import type { FieldErrors } from '@/lib/validation';
import FieldError, { errorProps, Required } from './FieldError';
import TextField from './TextField';

interface ExperienceFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: FieldErrors;
}

const CONTENT_TYPES = ['Photos', 'Videos', 'Live Streaming', 'Messaging', 'Custom Content'];

const ExperienceForm = ({ formData, updateFormData, errors }: ExperienceFormProps) => {
  const toggleContentType = (type: string) => {
    updateFormData({
      contentTypes: formData.contentTypes.includes(type)
        ? formData.contentTypes.filter((t) => t !== type)
        : [...formData.contentTypes, type],
    });
  };
  const levelErr = errorProps('experienceLevel', errors.experienceLevel);
  const availErr = errorProps('availability', errors.availability);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="experienceLevel">Experience Level<Required /></Label>
        <Select value={formData.experienceLevel} onValueChange={(value) => updateFormData({ experienceLevel: value })}>
          <SelectTrigger id="experienceLevel" aria-required="true" aria-invalid={levelErr['aria-invalid']}
            aria-describedby={levelErr['aria-describedby']} className={levelErr.className}>
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New to Content Creating</SelectItem>
            <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
            <SelectItem value="intermediate">Intermediate (6-12 months)</SelectItem>
            <SelectItem value="experienced">Experienced (1-2 years)</SelectItem>
            <SelectItem value="veteran">Veteran (2+ years)</SelectItem>
          </SelectContent>
        </Select>
        <FieldError id="experienceLevel" message={errors.experienceLevel} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none">What type of content are you interested in creating?</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {CONTENT_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-3 min-h-[44px]">
              <Checkbox
                id={`content-${type}`}
                checked={formData.contentTypes.includes(type)}
                onCheckedChange={() => toggleContentType(type)}
                className="h-5 w-5"
              />
              <Label htmlFor={`content-${type}`} className="cursor-pointer py-2">{type}</Label>
            </div>
          ))}
        </div>
        <FieldError id="contentTypes" message={errors.contentTypes} />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="availability">Weekly Availability (hours)<Required /></Label>
        <Select value={formData.availability} onValueChange={(value) => updateFormData({ availability: value })}>
          <SelectTrigger id="availability" aria-required="true" aria-invalid={availErr['aria-invalid']}
            aria-describedby={availErr['aria-describedby']} className={availErr.className}>
            <SelectValue placeholder="Select your weekly availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-5">1-5 hours</SelectItem>
            <SelectItem value="5-10">5-10 hours</SelectItem>
            <SelectItem value="10-20">10-20 hours</SelectItem>
            <SelectItem value="20-30">20-30 hours</SelectItem>
            <SelectItem value="30+">30+ hours</SelectItem>
          </SelectContent>
        </Select>
        <FieldError id="availability" message={errors.availability} />
      </div>

      <TextField id="goalsOnPlatform" label="Your Goals on OnlyFans" multiline className="min-h-24" maxLength={2000}
        placeholder="What are you hoping to achieve on OnlyFans? What are your income goals?"
        value={formData.goalsOnPlatform} error={errors.goalsOnPlatform}
        onChange={(v) => updateFormData({ goalsOnPlatform: v })} />
    </div>
  );
};

export default ExperienceForm;
