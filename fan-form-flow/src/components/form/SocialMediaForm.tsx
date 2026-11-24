import React from 'react';
import { FormData } from '@/types/form';
import type { FieldErrors } from '@/lib/validation';
import TextField from './TextField';

interface SocialMediaFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: FieldErrors;
}

const SocialMediaForm = ({ formData, updateFormData, errors }: SocialMediaFormProps) => (
  <div className="space-y-6">
    <p className="text-sm text-gray-600">All fields on this step are optional, but they help us understand your current audience.</p>
    <TextField id="instagram" label="Instagram Username" placeholder="@yourusername" maxLength={200}
      value={formData.instagram} error={errors.instagram} onChange={(v) => updateFormData({ instagram: v })} />
    <TextField id="twitter" label="Twitter/X Username" placeholder="@yourusername" maxLength={200}
      value={formData.twitter} error={errors.twitter} onChange={(v) => updateFormData({ twitter: v })} />
    <TextField id="tiktok" label="TikTok Username" placeholder="@yourusername" maxLength={200}
      value={formData.tiktok} error={errors.tiktok} onChange={(v) => updateFormData({ tiktok: v })} />
    <TextField id="onlyfans" label="Existing OnlyFans Username (if any)" placeholder="@yourusername" maxLength={200}
      value={formData.onlyfans} error={errors.onlyfans} onChange={(v) => updateFormData({ onlyfans: v })} />
    <TextField id="otherPlatforms" label="Other Social Media or Content Platforms" placeholder="List any other platforms you use" maxLength={1000}
      value={formData.otherPlatforms} error={errors.otherPlatforms} onChange={(v) => updateFormData({ otherPlatforms: v })} />
    <TextField id="followersCount" label="Approximate Total Social Media Following" placeholder="e.g. 10,000" inputMode="numeric" maxLength={50}
      value={formData.followersCount} error={errors.followersCount} onChange={(v) => updateFormData({ followersCount: v })} />
  </div>
);

export default SocialMediaForm;
