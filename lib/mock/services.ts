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
  const participants: User[] =
    message.participants && message.participants.length > 0
      ? message.participants
      : message.participant_ids
          .map((participantId) => resolveUserById(participantId))
          .filter((participant): participant is User => Boolean(participant));

  const otherParticipantId =
    message.participant_ids.find((participantId) => participantId !== userId) ||
    userId;

  const otherParticipant =
    participants?.find((participant) => participant.id === otherParticipantId) ||
    resolveUserById(otherParticipantId);

  return {
    ...message,
    participants,
    other_participant_id: otherParticipant?.id,
    other_participant: otherParticipant,
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
    return mockMessages
      .filter((message) => message.participant_ids.includes(userId))
      .map((message) => hydrateMessageForUser(message, userId));
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay(500);
    return mockMessages.filter(
      (message) =>
        message.participant_ids.includes(userId) &&
        message.author_id !== userId &&
        !message.read
    ).length;
  },

  async sendMessage(
    participantId: string,
    officeId: string,
    subject: string,
    content: string
  ): Promise<Message> {
    await delay(1000);
    const office = mockOffices.find((o) => o.id === officeId);
    const recipient =
      mockAdminUsers.find((admin) => admin.id === participantId) ||
      (participantId === mockCurrentUser.id ? mockCurrentUser : undefined);
    const participants = [mockCurrentUser];
    if (recipient) {
      participants.push(recipient);
    }
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      author_id: mockCurrentUser.id,
      participant_ids: [mockCurrentUser.id, participantId],
      office_id: officeId,
      subject,
      content,
      read: false,
      created_at: new Date().toISOString(),
      author: mockCurrentUser,
      participants,
      office,
    };
    mockMessages.push(newMessage);
    return hydrateMessageForUser(newMessage, mockCurrentUser.id);
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
