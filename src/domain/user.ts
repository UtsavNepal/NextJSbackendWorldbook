export interface User {
  id: string;
  firstname: string | null;
  lastname: string | null;
  birthday: Date | null;
  gender: string | null;
  email: string;
  emailActive: boolean;
  profilePicture: string | null;
  isActive: boolean;
  isStaff: boolean;
  isVerified: boolean;
  otp: string | null;
  joinedAt: Date | null;
  password: string;
} 