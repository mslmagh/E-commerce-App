export interface UserProfile {
    id: number;
    username: string;
    email: string;
    firstName?: string; // Optional as they can be null
    lastName?: string;  // Optional
    phoneNumber?: string; // Optional
    taxId?: string;     // Optional
    roles: string[];
} 