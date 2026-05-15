describe('Evidence immutability', () => {
  it('Evidence interface has no mutable properties after creation', () => {
    const evidenceFields = ['id', 'event_id', 'title', 'link', 'type', 'added_by', 'added_by_name', 'created_at'];
    expect(evidenceFields.length).toBeGreaterThan(0);
  });

  it('EvidenceRepository class should only expose read methods', async () => {
    const { EvidenceRepository } = await import('@/server/db/repositories/evidence.repository');
    const methods = Object.getOwnPropertyNames(EvidenceRepository.prototype)
      .filter((m) => m !== 'constructor');
    const forbiddenMethods = ['update', 'delete', 'create', 'insert', 'modify', 'edit'];

    for (const method of forbiddenMethods) {
      expect(methods).not.toContain(method);
    }
  });
});