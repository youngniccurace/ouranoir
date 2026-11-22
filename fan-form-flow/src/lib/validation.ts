/**
 * Client-side validation for the application form.
 * Mirrors the server rules in public/process_form.php (which re-checks everything),
 * so users get instant, inline feedback and invalid data never reaches the backend unchecked.
 */
import type { FormData } from '@/types/form';

export type FieldErrors = Partial<Record<string, string>>;

export const MAX_PHOTOS = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, after client-side compression
export const EXPERIENCE_LEVELS = ['new', 'beginner', 'intermediate', 'experienced', 'veteran'];
export const AVAILABILITY = ['1-5', '5-10', '10-20', '20-30', '30+'];

/** Which step each field lives on (used to jump to the first server-side error). */
export const FIELD_STEP: Record<string, number> = {
  firstName: 0, lastName: 0, stageName: 0, dateOfBirth: 0, email: 0, phone: 0, location: 0, aboutYou: 0,
  instagram: 1, twitter: 1, tiktok: 1, onlyfans: 1, otherPlatforms: 1, followersCount: 1,
  experienceLevel: 2, contentTypes: 2, availability: 2, goalsOnPlatform: 2,
  photos: 3, idFile: 3,
  agreeTerms: 4, agreeContact: 4, confirmAccurate: 4, turnstile: 4,
};

export const getAge = (dateOfBirth: string): number => {
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]+$/;
const FOLLOWERS_RE = /^[0-9][0-9,.\sKkMm+]*$/;

export function validateStep(step: number, data: FormData): FieldErrors {
  const e: FieldErrors = {};
  const len = (v: string) => v.trim().length;

  if (step === 0) {
    if (!len(data.firstName)) e.firstName = 'Please enter your first name.';
    if (!len(data.lastName)) e.lastName = 'Please enter your last name.';
    if (!data.dateOfBirth) {
      e.dateOfBirth = 'Please enter your date of birth.';
    } else {
      const age = getAge(data.dateOfBirth);
      if (Number.isNaN(age) || age > 120 || new Date(data.dateOfBirth) > new Date()) e.dateOfBirth = 'Please enter a valid date of birth.';
      else if (age < 18) e.dateOfBirth = 'You must be at least 18 years old to apply.';
    }
    if (!len(data.email)) e.email = 'Please enter your email address.';
    else if (!EMAIL_RE.test(data.email.trim())) e.email = 'Please enter a valid email address, like name@example.com.';
    const digits = data.phone.replace(/\D/g, '');
    if (!len(data.phone)) e.phone = 'Please enter your phone number.';
    else if (!PHONE_RE.test(data.phone.trim()) || digits.length < 7 || digits.length > 15) {
      e.phone = 'Please enter a valid phone number, including country code (e.g. +254 712 345 678).';
    }
    if (len(data.aboutYou) > 2000) e.aboutYou = 'Please keep this under 2,000 characters.';
  }

  if (step === 1) {
    if (len(data.followersCount) && !FOLLOWERS_RE.test(data.followersCount.trim())) {
      e.followersCount = 'Please enter a number, e.g. 12,500 or 12.5K.';
    }
    (['instagram', 'twitter', 'tiktok', 'onlyfans'] as const).forEach((f) => {
      if (len(data[f]) > 200) e[f] = 'This is too long.';
    });
  }

  if (step === 2) {
    if (!EXPERIENCE_LEVELS.includes(data.experienceLevel)) e.experienceLevel = 'Please choose your experience level.';
    if (!AVAILABILITY.includes(data.availability)) e.availability = 'Please choose your weekly availability.';
    if (len(data.goalsOnPlatform) > 2000) e.goalsOnPlatform = 'Please keep this under 2,000 characters.';
  }

  if (step === 3) {
    if (data.photoFiles.length === 0) e.photos = 'Please upload at least one photo.';
    if (!data.idFile) e.idFile = 'Please upload a photo of your ID.';
  }

  if (step === 4) {
    if (!data.agreeTerms) e.agreeTerms = 'Please confirm you are 18+ and accept the Terms and Privacy Policy.';
    if (!data.agreeContact) e.agreeContact = 'Please agree to be contacted about your application.';
    if (!data.confirmAccurate) e.confirmAccurate = 'Please confirm your information is accurate.';
  }

  return e;
}
