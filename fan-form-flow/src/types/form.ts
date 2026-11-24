
export interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  stageName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  location: string;
  aboutYou: string;
  
  // Social Media
  instagram: string;
  twitter: string;
  tiktok: string;
  onlyfans: string;
  otherPlatforms: string;
  followersCount: string;
  
  // Experience
  experienceLevel: string;
  contentTypes: string[];
  availability: string;
  goalsOnPlatform: string;
  
  // Photos
  photoUrls: string[];      // object URLs used for previews only
  photoFiles: File[];       // the actual photo files that get uploaded
  idVerification: string;   // file name of the ID document (for display)
  idFile: File | null;      // the actual ID document that gets uploaded
  
  // Submission
  agreeTerms: boolean;
  agreeContact: boolean;
  confirmAccurate: boolean;
}

export const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  stageName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  location: '',
  aboutYou: '',
  
  instagram: '',
  twitter: '',
  tiktok: '',
  onlyfans: '',
  otherPlatforms: '',
  followersCount: '',
  
  experienceLevel: '',
  contentTypes: [],
  availability: '',
  goalsOnPlatform: '',
  
  photoUrls: [],
  photoFiles: [],
  idVerification: '',
  idFile: null,
  
  agreeTerms: false,
  agreeContact: false,
  confirmAccurate: false
};
