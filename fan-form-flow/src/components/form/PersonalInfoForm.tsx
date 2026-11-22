
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormData } from '@/types/form';

interface PersonalInfoFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const PersonalInfoForm = ({ formData, updateFormData }: PersonalInfoFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Your first name"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Your last name"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="stageName">Stage Name (if different)</Label>
          <Input
            id="stageName"
            placeholder="Your stage name"
            value={formData.stageName}
            onChange={(e) => updateFormData({ stageName: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Your phone number"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="location">Location (City, Country)</Label>
          <Input
            id="location"
            placeholder="New York, USA"
            value={formData.location}
            onChange={(e) => updateFormData({ location: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="aboutYou">Tell us about yourself</Label>
          <Textarea
            id="aboutYou"
            placeholder="Share a bit about yourself, your background, and why you're interested in becoming an OnlyFans model with our agency..."
            className="min-h-32"
            value={formData.aboutYou}
            onChange={(e) => updateFormData({ aboutYou: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
