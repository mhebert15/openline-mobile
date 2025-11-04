import { describe, it, expect } from 'vitest';
import { mockMeetingsService } from '@/lib/mock/services';
import { mockCurrentUser } from '@/lib/mock/data';

describe('Meetings Service', () => {
  it('should get upcoming meetings', async () => {
    const meetings = await mockMeetingsService.getUpcomingMeetings(
      mockCurrentUser.id
    );

    expect(Array.isArray(meetings)).toBe(true);
    meetings.forEach((meeting) => {
      expect(meeting.status).toBe('scheduled');
      expect(new Date(meeting.scheduled_at).getTime()).toBeGreaterThan(
        Date.now()
      );
    });
  });

  it('should get completed meetings count', async () => {
    const count = await mockMeetingsService.getCompletedMeetingsCount(
      mockCurrentUser.id
    );

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should get all meetings for a user', async () => {
    const meetings = await mockMeetingsService.getAllMeetings(mockCurrentUser.id);

    expect(Array.isArray(meetings)).toBe(true);
    meetings.forEach((meeting) => {
      expect(meeting.medical_rep_id).toBe(mockCurrentUser.id);
    });
  });

  it('should create a new meeting', async () => {
    const officeId = 'office-1';
    const scheduledAt = new Date('2024-12-01T10:00:00').toISOString();
    const notes = 'Test meeting';

    const meeting = await mockMeetingsService.createMeeting(
      officeId,
      scheduledAt,
      notes
    );

    expect(meeting).toBeDefined();
    expect(meeting.office_id).toBe(officeId);
    expect(meeting.scheduled_at).toBe(scheduledAt);
    expect(meeting.notes).toBe(notes);
    expect(meeting.status).toBe('scheduled');
    expect(meeting.duration_minutes).toBe(30);
  });
});
