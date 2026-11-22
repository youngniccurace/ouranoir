import React from 'react';
import { FormData } from '@/types/form';
import type { FieldErrors } from '@/lib/validation';
import TextField from './TextField';

interface PersonalInfoFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: FieldErrors;
}

const PersonalInfoForm = ({ formData, updateFormData, errors }: PersonalInfoFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField id="firstName" label="First Name" required autoComplete="given-name" maxLength={100}
          placeholder="Your first name" value={formData.firstName} error={errors.firstName}
          onChange={(v) => updateFormData({ firstName: v })} />
        <TextField id="lastName" label="Last Name" required autoComplete="family-name" maxLength={100}
          placeholder="Your last name" value={formData.lastName} error={errors.lastName}
          onChange={(v) => updateFormData({ lastName: v })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField id="stageName" label="Stage Name (if different)" autoComplete="nickname" maxLength={100}
          placeholder="Your stage name" value={formData.stageName} error={errors.stageName}
          onChange={(v) => updateFormData({ stageName: v })} />
        <TextField id="dateOfBirth" label="Date of Birth" type="date" required autoComplete="bday"
          hint="You must be 18 or over to apply." value={formData.dateOfBirth} error={errors.dateOfBirth}
          onChange={(v) => updateFormData({ dateOfBirth: v })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField id="email" label="Email Address" type="email" required autoComplete="email" inputMode="email" maxLength={254}
          placeholder="your.email@example.com" value={formData.email} error={errors.email}
          onChange={(v) => updateFormData({ email: v })} />
        <TextField id="phone" label="Phone Number" type="tel" required autoComplete="tel" inputMode="tel" maxLength={40}
          placeholder="+254 712 345 678" value={formData.phone} error={errors.phone}
          onChange={(v) => updateFormData({ phone: v })} />
      </div>

      <TextField id="location" label="Location (City, Country)" autoComplete="address-level2" maxLength={150}
        placeholder="Nairobi, Kenya" value={formData.location} error={errors.location}
        onChange={(v) => updateFormData({ location: v })} />

      <TextField id="aboutYou" label="Tell us about yourself" multiline className="min-h-32" maxLength={2000}
        placeholder="Share a bit about yourself, your background, and why you're interested in working with our agency..."
        value={formData.aboutYou} error={errors.aboutYou}
        onChange={(v) => updateFormData({ aboutYou: v })} />
    </div>
  );
};

export default PersonalInfoForm;
