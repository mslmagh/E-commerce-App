export interface UpdateUserProfileRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    taxId?: string; // Optional, as it may not always be sent
} 