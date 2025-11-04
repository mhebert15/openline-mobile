import { describe, it, expect } from 'vitest';
import { mockOfficesService } from '@/lib/mock/services';

describe('Offices Service', () => {
  it('should get all offices', async () => {
    const offices = await mockOfficesService.getAllOffices();

    expect(Array.isArray(offices)).toBe(true);
    expect(offices.length).toBeGreaterThan(0);
    offices.forEach((office) => {
      expect(office.id).toBeDefined();
      expect(office.name).toBeDefined();
      expect(office.address).toBeDefined();
      expect(office.city).toBeDefined();
      expect(office.state).toBeDefined();
    });
  });

  it('should get office by id', async () => {
    const office = await mockOfficesService.getOfficeById('office-1');

    expect(office).toBeDefined();
    expect(office?.id).toBe('office-1');
    expect(office?.name).toBeDefined();
  });

  it('should return null for non-existent office', async () => {
    const office = await mockOfficesService.getOfficeById('non-existent-id');

    expect(office).toBeNull();
  });

  it('should get available slots for an office', async () => {
    const slots = await mockOfficesService.getAvailableSlots(
      'office-1',
      '2024-11-10'
    );

    expect(Array.isArray(slots)).toBe(true);
    slots.forEach((slot) => {
      expect(slot.time).toBeDefined();
      expect(typeof slot.available).toBe('boolean');
    });
  });
});
