
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FormData } from '@/types/form';
import { X, Upload } from 'lucide-react';

interface PhotosFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, must match process_form.php

const PhotosForm = ({ formData, updateFormData }: PhotosFormProps) => {
  // Files are kept in the shared form state (not local state) so they survive
  // moving between steps and can be uploaded on submit.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    e.target.value = ''; // allow picking the same file again after removing it

    const valid = picked.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    });

    const room = MAX_PHOTOS - formData.photoFiles.length;
    if (valid.length > room) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos`);
    }
    const newFiles = valid.slice(0, Math.max(room, 0));

    updateFormData({
      photoFiles: [...formData.photoFiles, ...newFiles],
      photoUrls: [...formData.photoUrls, ...newFiles.map(file => URL.createObjectURL(file))],
    });
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(formData.photoUrls[index]); // Clean up object URL
    updateFormData({
      photoFiles: formData.photoFiles.filter((_, i) => i !== index),
      photoUrls: formData.photoUrls.filter((_, i) => i !== index),
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Upload Photos</Label>
        <p className="text-sm text-gray-500">
          Please upload 2-5 recent photos that represent your modeling style. 
          These should be professional-quality photos that showcase your appearance.
        </p>
        
        <div className="mt-4 flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <p className="text-sm text-gray-500">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG up to 10MB
              </p>
            </div>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              multiple
            />
          </label>
        </div>
      </div>
      
      {formData.photoUrls.length > 0 && (
        <div>
          <Label>Uploaded Photos</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {formData.photoUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Uploaded image ${index + 1}`}
                  className="h-32 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1
                    opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="idVerification">ID Verification</Label>
        <p className="text-sm text-gray-500 mb-2">
          Please upload a clear photo of your government-issued ID to verify that you are 18+ years old.
          This will be kept confidential and used only for verification purposes.
        </p>
        <Input
          id="idVerification"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
              toast.error('Please upload an image of your ID');
              return;
            }
            if (file.size > MAX_FILE_SIZE) {
              toast.error('ID image must be smaller than 10MB');
              return;
            }
            updateFormData({ idVerification: file.name, idFile: file });
          }}
        />
        {formData.idVerification && (
          <p className="text-xs text-gray-500">Selected: {formData.idVerification}</p>
        )}
      </div>
    </div>
  );
};

export default PhotosForm;
