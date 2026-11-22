
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormData } from '@/types/form';

interface SocialMediaFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const SocialMediaForm = ({ formData, updateFormData }: SocialMediaFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram Username</Label>
        <Input
          id="instagram"
          placeholder="@yourusername"
          value={formData.instagram}
          onChange={(e) => updateFormData({ instagram: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="twitter">Twitter/X Username</Label>
        <Input
          id="twitter"
          placeholder="@yourusername"
          value={formData.twitter}
          onChange={(e) => updateFormData({ twitter: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tiktok">TikTok Username</Label>
        <Input
          id="tiktok"
          placeholder="@yourusername"
          value={formData.tiktok}
          onChange={(e) => updateFormData({ tiktok: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="onlyfans">Existing OnlyFans Username (if any)</Label>
        <Input
          id="onlyfans"
          placeholder="@yourusername"
          value={formData.onlyfans}
          onChange={(e) => updateFormData({ onlyfans: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="otherPlatforms">Other Social Media or Content Platforms</Label>
        <Input
          id="otherPlatforms"
          placeholder="List any other platforms you use"
          value={formData.otherPlatforms}
          onChange={(e) => updateFormData({ otherPlatforms: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="followersCount">Approximate Total Social Media Following</Label>
        <Input
          id="followersCount"
          placeholder="e.g., 10,000"
          value={formData.followersCount}
          onChange={(e) => updateFormData({ followersCount: e.target.value })}
        />
      </div>
    </div>
  );
};

export default SocialMediaForm;
