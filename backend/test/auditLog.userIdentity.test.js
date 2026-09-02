import { describe, it, expect } from 'vitest';
import { AuditService } from '../src/modules/auditLogs/audit.service.js';

describe('AuditService user identity helpers', () => {
  it('builds a unique human-readable actor label with name and contact details', () => {
    const label = AuditService.buildActorLabel({
      name: 'Rajesh Rai',
      phone: '+919876543210',
      email: 'rajesh@example.com'
    });

    expect(label).toContain('Rajesh Rai');
    expect(label).toContain('+919876543210');
    expect(label).toContain('rajesh@example.com');
  });
});
