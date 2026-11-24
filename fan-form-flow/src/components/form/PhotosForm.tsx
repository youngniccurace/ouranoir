import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormData } from '@/types/form';
import { X, Upload, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/compressImage';
import { MAX_FILE_SIZE, MAX_PHOTOS, type FieldErrors } from '@/lib/validation';
import FieldError, { Required } from './FieldError';

interface PhotosFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: FieldErrors;
  setFieldError: (field: string, message?: string) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const isImage = (f: File) => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name);

const PhotosForm = ({ formData, updateFormData, errors, setFieldError }: PhotosFormProps) => {
  const [busy, setBusy] = useState(false);

  // Files are kept in the shared form state so they survive moving between steps.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    e.target.value = ''; // allow picking the same file again after removing it

    const problems: string[] = [];
    const room = MAX_PHOTOS - formData.photoFiles.length;
    if (picked.length > room) problems.push(`You can upload up to ${MAX_PHOTOS} photos.`);

    setBusy(true);
    const accepted: File[] = [];
    for (const file of picked.slice(0, Math.max(room, 0))) {
      if (!isImage(file)) { problems.push(`${file.name} is not an image.`); continue; }
      const small = await compressImage(file);
      if (small.size > MAX_FILE_SIZE) { problems.push(`${file.name} is larger than 10MB.`); continue; }
      accepted.push(small);
    }
    setBusy(false);

    updateFormData({
      photoFiles: [...formData.photoFiles, ...accepted],
      photoUrls: [...formData.photoUrls, ...accepted.map((file) => URL.createObjectURL(file))],
    });
    setFieldError('photos', problems.length ? problems.join(' ') : undefined);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(formData.photoUrls[index]);
    updateFormData({
      photoFiles: formData.photoFiles.filter((_, i) => i !== index),
      photoUrls: formData.photoUrls.filter((_, i) => i !== index),
    });
  };

  const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isImage(file)) { setFieldError('idFile', 'Please upload an image (JPG, PNG or WEBP) of your ID.'); return; }
    setBusy(true);
    const small = await compressImage(file, 3000, 0.9); // keep ID text sharp
    setBusy(false);
    if (small.size > MAX_FILE_SIZE) { setFieldError('idFile', 'Your ID image must be smaller than 10MB.'); return; }
    updateFormData({ idVerification: file.name, idFile: small });
    setFieldError('idFile', undefined);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload Photos<Required /></Label>
        <p id="file-upload-hint" className="text-sm text-gray-600">
          Please upload 2-5 recent photos that represent your style. JPG, PNG, WEBP or HEIC; large photos are
          automatically resized before upload.
        </p>

        <div className="mt-4 flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors focus-within:ring-2 focus-within:ring-[#8F6526] ${errors.photos ? 'border-[#B02A37]' : 'border-gray-400'}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {busy ? <Loader2 className="w-8 h-8 text-gray-600 mb-2 animate-spin" aria-hidden="true" /> : <Upload className="w-8 h-8 text-gray-600 mb-2" aria-hidden="true" />}
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{busy ? 'Preparing photos…' : 'Tap to choose photos'}</span>
              </p>
              <p className="text-xs text-gray-600">Up to {MAX_PHOTOS} photos, max 10MB each</p>
            </div>
            <Input
              id="file-upload"
              type="file"
              className="sr-only"
              accept={ACCEPT}
              onChange={handleFileChange}
              multiple
              disabled={busy}
              aria-describedby={errors.photos ? 'file-upload-hint photos-error' : 'file-upload-hint'}
              aria-invalid={errors.photos ? true : undefined}
            />
          </label>
        </div>
        <FieldError id="photos" message={errors.photos} />
      </div>

      {formData.photoUrls.length > 0 && (
        <div>
          <p className="text-sm font-medium">Your photos ({formData.photoUrls.length} of {MAX_PHOTOS})</p>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {formData.photoUrls.map((url, index) => (
              <li key={url} className="relative">
                <img
                  src={url}
                  alt={`Your uploaded photo ${index + 1}`}
                  className="h-32 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white rounded-full p-2 shadow min-w-[44px] min-h-[44px] flex items-center justify-center"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X className="h-5 w-5 text-[#B02A37]" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="idVerification">ID Verification<Required /></Label>
        <p id="idVerification-hint" className="text-sm text-gray-600 mb-2">
          Please upload a clear photo of your government-issued ID to verify that you are 18+ years old.
          This will be kept confidential and used only for verification purposes.
        </p>
        <Input
          id="idVerification"
          type="file"
          accept={ACCEPT}
          onChange={handleIdChange}
          disabled={busy}
          className={`min-h-[44px] ${errors.idFile ? 'border-[#B02A37]' : ''}`}
          aria-describedby={errors.idFile ? 'idVerification-hint idFile-error' : 'idVerification-hint'}
          aria-invalid={errors.idFile ? true : undefined}
          aria-required="true"
        />
        {formData.idVerification && !errors.idFile && (
          <p className="text-sm text-gray-700">Selected: {formData.idVerification}</p>
        )}
        <FieldError id="idFile" message={errors.idFile} />
      </div>
    </div>
  );
};

export default PhotosForm;
