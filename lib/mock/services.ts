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

const resolveUserById = (id: string): User | undefined => {
  if (id === mockCurrentUser.id) {
    return mockCurrentUser;
  }

  return mockAdminUsers.find((admin) => admin.id === id);
};

const hydrateMessageForUser = (message: Message, userId: string): Message => {
  // Determine the other participant (the one that's not the current user)
  const otherParticipant =
    message.sender_profile_id === userId
      ? message.recipient
      : message.sender;

  return {
    ...message,
    sender: message.sender || resolveUserById(message.sender_profile_id),
    recipient: message.recipient || resolveUserById(message.recipient_profile_id || ""),
  };
};

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
        (meeting.status === 'pending' || meeting.status === 'approved') &&
        new Date(meeting.start_at) > now
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
    const startDate = new Date(scheduledAt);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      location_id: officeId,
      medical_rep_id: mockCurrentUser.id,
      requested_by_profile_id: mockCurrentUser.id,
      provider_id: null,
      food_preferences_id: null,
      meeting_type: 'in_person',
      title: null,
      description: notes || null,
      start_at: scheduledAt,
      end_at: endDate.toISOString(),
      status: 'pending',
      auto_approved: false,
      approved_by_profile_id: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: office as any, // Mock data uses MedicalOffice, but Meeting expects Location
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
    return mockMessages
      .filter(
        (message) =>
          message.sender_profile_id === userId ||
          message.recipient_profile_id === userId
      )
      .map((message) => hydrateMessageForUser(message, userId));
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay(500);
    return mockMessages.filter(
      (message) =>
        (message.sender_profile_id === userId ||
          message.recipient_profile_id === userId) &&
        message.sender_profile_id !== userId &&
        !message.read_at
    ).length;
  },

  async sendMessage(
    recipientId: string,
    locationId: string,
    body: string
  ): Promise<Message> {
    await delay(1000);
    const location = mockOffices.find((o) => o.id === locationId);
    const recipient =
      mockAdminUsers.find((admin) => admin.id === recipientId) ||
      (recipientId === mockCurrentUser.id ? mockCurrentUser : undefined);
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      location_id: locationId,
      meeting_id: null,
      sender_profile_id: mockCurrentUser.id,
      recipient_profile_id: recipientId,
      body,
      sent_at: new Date().toISOString(),
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: location as any, // Mock data uses MedicalOffice, but Message expects Location
      sender: mockCurrentUser,
      recipient,
    };
    mockMessages.push(newMessage);
    return hydrateMessageForUser(newMessage, mockCurrentUser.id);
  },

  async markAsRead(messageId: string): Promise<void> {
    await delay(500);
    const message = mockMessages.find((m) => m.id === messageId);
    if (message) {
      message.read_at = new Date().toISOString();
    }
  },

  async getAdminUsers(): Promise<User[]> {
    await delay(500);
    return mockAdminUsers;
  },
};
