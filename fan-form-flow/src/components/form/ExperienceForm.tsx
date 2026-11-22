
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormData } from '@/types/form';

interface ExperienceFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const ExperienceForm = ({ formData, updateFormData }: ExperienceFormProps) => {
  const contentTypes = [
    "Photos", 
    "Videos", 
    "Live Streaming", 
    "Messaging", 
    "Custom Content"
  ];

  const handleContentTypeChange = (type: string) => {
    const updatedContentTypes = formData.contentTypes.includes(type)
      ? formData.contentTypes.filter(t => t !== type)
      : [...formData.contentTypes, type];
    
    updateFormData({ contentTypes: updatedContentTypes });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="experienceLevel">Experience Level</Label>
        <Select 
          value={formData.experienceLevel} 
          onValueChange={(value) => updateFormData({ experienceLevel: value })}
        >
          <SelectTrigger id="experienceLevel">
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
      </div>
      
      <div className="space-y-2">
        <Label>What type of content are you interested in creating?</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {contentTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`content-${type}`} 
                checked={formData.contentTypes.includes(type)} 
                onCheckedChange={() => handleContentTypeChange(type)} 
              />
              <Label htmlFor={`content-${type}`} className="cursor-pointer">{type}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="availability">Weekly Availability (hours)</Label>
        <Select 
          value={formData.availability} 
          onValueChange={(value) => updateFormData({ availability: value })}
        >
          <SelectTrigger id="availability">
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
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="goalsOnPlatform">Your Goals on OnlyFans</Label>
        <Textarea
          id="goalsOnPlatform"
          placeholder="What are you hoping to achieve on OnlyFans? What are your income goals?"
          className="min-h-24"
          value={formData.goalsOnPlatform}
          onChange={(e) => updateFormData({ goalsOnPlatform: e.target.value })}
        />
      </div>
    </div>
  );
};

export default ExperienceForm;
