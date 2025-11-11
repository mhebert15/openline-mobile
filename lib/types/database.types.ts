// Supabase Database Types

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'medical_rep' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Practitioner {
  id: string;
  name: string;
  title: string;
  specialty: string;
}

export interface PreferredMeetingTimes {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
}

export interface FoodPreferences {
  dietary_restrictions: string[];
  favorite_foods: string[];
  dislikes: string[];
}

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

export interface Meeting {
  id: string;
  medical_rep_id: string;
  office_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  office?: MedicalOffice;
}

export interface Message {
  id: string;
  author_id: string;
  participant_ids: string[];
  office_id: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
  author?: User;
  participants?: User[];
  office?: MedicalOffice;
  other_participant_id?: string;
  other_participant?: User;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  preferred?: boolean;
  clinicianCount?: number;
}

export interface AvailableSlot {
  office_id: string;
  date: string;
  time_slots: TimeSlot[];
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      medical_offices: {
        Row: MedicalOffice;
        Insert: Omit<MedicalOffice, 'id' | 'created_at'>;
        Update: Partial<Omit<MedicalOffice, 'id' | 'created_at'>>;
      };
      meetings: {
        Row: Meeting;
        Insert: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Meeting, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
    };
  };
}
