import { describe, it, expect } from 'vitest';
import { mockMessagesService } from '@/lib/mock/services';
import { mockCurrentUser } from '@/lib/mock/data';

describe('Messages Service', () => {
  it('should get messages for a user', async () => {
    const messages = await mockMessagesService.getMessages(mockCurrentUser.id);

    expect(Array.isArray(messages)).toBe(true);
    messages.forEach((message) => {
      expect(message.participant_ids).toContain(mockCurrentUser.id);
      expect(message.other_participant_id).toBeDefined();
    });
  });

  it('should get unread count', async () => {
    const count = await mockMessagesService.getUnreadCount(mockCurrentUser.id);

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should send a message', async () => {
    const participantId = 'admin-1';
    const officeId = 'office-1';
    const subject = 'Test Subject';
    const content = 'Test message content';

    const message = await mockMessagesService.sendMessage(
      participantId,
      officeId,
      subject,
      content
    );

    expect(message).toBeDefined();
    expect(message.author_id).toBe(mockCurrentUser.id);
    expect(message.participant_ids).toContain(mockCurrentUser.id);
    expect(message.participant_ids).toContain(participantId);
    expect(message.other_participant_id).toBe(participantId);
    expect(message.office_id).toBe(officeId);
    expect(message.subject).toBe(subject);
    expect(message.content).toBe(content);
    expect(message.read).toBe(false);
  });

  it('should get admin users', async () => {
    const admins = await mockMessagesService.getAdminUsers();

    expect(Array.isArray(admins)).toBe(true);
    admins.forEach((admin) => {
      expect(admin.role).toBe('admin');
    });
  });
});
