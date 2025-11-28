// Supabase Database Types

// Profile table structure from Supabase (matches profiles table)
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  user_type: string; // 'office_staff' | 'medical_rep' | 'admin' | etc.
  default_company_id: string | null;
  default_location_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Legacy User interface for backward compatibility (mapped from Profile)
export type User = Profile;

// Company table structure from Supabase
export interface Company {
  id: string;
  name: string;
  website: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

// Location table structure from Supabase (matches locations table)
export interface Location {
  id: string;
  company_id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  timezone: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

// MedicalOffice interface for UI (mapped from Location)
export interface MedicalOffice {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  latitude: number;
  longitude: number;
  created_at: string;
  practitioners?: Practitioner[];
  preferred_meeting_times?: PreferredMeetingTimes;
  food_preferences?: FoodPreferences;
  admin_user_id?: string;
  image_url?: string;
}

// Medical Rep table structure from Supabase
export interface MedicalRep {
  id: string;
  profile_id: string | null;
  company_name: string | null;
  territory: string | null;
  specialty_areas: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Medical Rep Location junction table
export interface MedicalRepLocation {
  id: string;
  medical_rep_id: string;
  location_id: string;
  relationship_status: string;
  created_at: string;
  updated_at: string;
}

// User Role table structure from Supabase
export interface UserRole {
  id: string;
  profile_id: string;
  location_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// // Provider table structure from Supabase
// export interface Provider {
//   id: string;
//   location_id: string;
//   profile_id: string | null;
//   first_name: string;
//   last_name: string;
//   credential: string | null;
//   specialty: string | null;
//   email: string | null;
//   phone: string | null;
//   status: string;
//   created_at: string;
//   updated_at: string;
// }

// Practitioner interface for UI (mapped from Provider)
export interface Practitioner {
  id: string;
  location_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  credential: string | null;
  title: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Location Preferred Time Slot from Supabase
export interface LocationPreferredTimeSlot {
  id: string;
  location_id: string;
  day_of_week: number; // 0 = Monday, 1 = Tuesday, etc.
  start_time: string; // time without time zone
  end_time: string; // time without time zone
  meeting_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreferredMeetingTimes {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
}

// Location Hours table structure from Supabase
export interface LocationHours {
  id: string;
  location_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  open_time: string | null; // time without time zone
  close_time: string | null; // time without time zone
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

// Food Preferences from Supabase
export interface FoodPreference {
  id: string;
  location_id: string;
  scope: string; // 'location' | 'provider' | etc.
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodPreferences {
  dietary_restrictions: string[];
  favorite_foods: string[];
  dislikes: string[];
}

// Provider Availability Effective table structure from Supabase
export interface ProviderAvailabilityEffective {
  id: string;
  provider_id: string;
  location_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (matching location_hours format)
  is_in_office: boolean;
  location_is_closed: boolean;
  is_in_office_effective: boolean;
  start_time: string | null; // time without time zone
  end_time: string | null; // time without time zone
  location_open_time: string | null; // time without time zone
  location_close_time: string | null; // time without time zone
  created_at: string;
  updated_at: string;
}

// Meeting table structure from Supabase (matches meetings table)
export interface Meeting {
  id: string;
  location_id: string;
  medical_rep_id: string;
  requested_by_profile_id: string;
  provider_id: string | null;
  food_preferences_id: string | null;
  meeting_type: string;
  title: string | null;
  description: string | null;
  start_at: string;
  end_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  auto_approved: boolean;
  approved_by_profile_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  location?: Location;
  medical_rep?: MedicalRep;
}

// Message table structure from Supabase (matches messages table)
export interface Message {
  id: string;
  location_id: string;
  meeting_id: string | null;
  sender_profile_id: string;
  recipient_profile_id: string | null;
  body: string;
  sent_at: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  location?: Location;
  sender?: Profile;
  recipient?: Profile;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  preferred?: boolean;
  availableProviders?: string[]; // List of provider names formatted as "First Last, Title"
  bookedByCurrentUser?: boolean;
  isBooked?: boolean;
}

export interface AvailableSlot {
  location_id: string;
  date: string;
  time_slots: TimeSlot[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;
      };
      meetings: {
        Row: Meeting;
        Insert: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Meeting, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at' | 'updated_at'>>;
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
      };
      medical_reps: {
        Row: MedicalRep;
        Insert: Omit<MedicalRep, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MedicalRep, 'id' | 'created_at' | 'updated_at'>>;
      };
      medical_rep_locations: {
        Row: MedicalRepLocation;
        Insert: Omit<MedicalRepLocation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MedicalRepLocation, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRole, 'id' | 'created_at' | 'updated_at'>>;
      };
      practitioners: {
        Row: Practitioner;
        Insert: Omit<Practitioner, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Practitioner, 'id' | 'created_at' | 'updated_at'>>;
      };
      location_hours: {
        Row: LocationHours;
        Insert: Omit<LocationHours, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LocationHours, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
