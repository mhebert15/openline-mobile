import type { User, MedicalOffice, Meeting, Message } from '../types/database.types';
import {
  mockCurrentUser,
  mockOffices,
  mockMeetings,
  mockMessages,
  mockAvailableSlots,
  mockAdminUsers,
} from './data';

// Simulate async API calls with delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    await delay(1000);
    console.log(`Magic link sent to: ${email}`);
    return {
      success: true,
      message: 'Magic link sent to your email. Check your inbox!',
    };
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(500);
    return mockCurrentUser;
  },

  async signOut(): Promise<void> {
    await delay(500);
    console.log('User signed out');
  },
};

export const mockMeetingsService = {
  async getUpcomingMeetings(userId: string): Promise<Meeting[]> {
    await delay(800);
    const now = new Date();
    return mockMeetings.filter(
      (meeting) =>
        meeting.medical_rep_id === userId &&
        meeting.status === 'scheduled' &&
        new Date(meeting.scheduled_at) > now
    );
  },

  async getCompletedMeetingsCount(userId: string): Promise<number> {
    await delay(600);
    return mockMeetings.filter(
      (meeting) => meeting.medical_rep_id === userId && meeting.status === 'completed'
    ).length;
  },

  async getAllMeetings(userId: string): Promise<Meeting[]> {
    await delay(800);
    return mockMeetings.filter((meeting) => meeting.medical_rep_id === userId);
  },

  async createMeeting(
    officeId: string,
    scheduledAt: string,
    notes?: string
  ): Promise<Meeting> {
    await delay(1000);
    const office = mockOffices.find((o) => o.id === officeId);
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      medical_rep_id: mockCurrentUser.id,
      office_id: officeId,
      scheduled_at: scheduledAt,
      duration_minutes: 30,
      status: 'scheduled',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      office,
    };
    mockMeetings.push(newMeeting);
    return newMeeting;
  },
};

export const mockOfficesService = {
  async getAllOffices(): Promise<MedicalOffice[]> {
    await delay(700);
    return mockOffices;
  },

  async getOfficeById(officeId: string): Promise<MedicalOffice | null> {
    await delay(500);
    return mockOffices.find((office) => office.id === officeId) || null;
  },

  async getAvailableSlots(officeId: string, date: string) {
    await delay(800);
    return mockAvailableSlots[officeId as keyof typeof mockAvailableSlots] || [];
  },
};

export const mockMessagesService = {
  async getMessages(userId: string): Promise<Message[]> {
    await delay(900);
    return mockMessages.filter(
      (message) => message.sender_id === userId || message.recipient_id === userId
    );
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay(500);
    return mockMessages.filter((message) => message.recipient_id === userId && !message.read)
      .length;
  },

  async sendMessage(
    recipientId: string,
    officeId: string,
    subject: string,
    content: string
  ): Promise<Message> {
    await delay(1000);
    const office = mockOffices.find((o) => o.id === officeId);
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      sender_id: mockCurrentUser.id,
      recipient_id: recipientId,
      office_id: officeId,
      subject,
      content,
      read: false,
      created_at: new Date().toISOString(),
      sender: mockCurrentUser,
      office,
    };
    mockMessages.push(newMessage);
    return newMessage;
  },

  async markAsRead(messageId: string): Promise<void> {
    await delay(500);
    const message = mockMessages.find((m) => m.id === messageId);
    if (message) {
      message.read = true;
    }
  },

  async getAdminUsers(): Promise<User[]> {
    await delay(500);
    return mockAdminUsers;
  },
};
