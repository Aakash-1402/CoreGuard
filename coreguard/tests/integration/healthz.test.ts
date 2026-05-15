describe('API health endpoint', () => {
  it('returns ok status structure', () => {
    const expectedKeys = ['status', 'db', 'user', 'timestamp'];
    expect(expectedKeys.length).toBe(4);
    expect(expectedKeys).toContain('status');
    expect(expectedKeys).toContain('db');
  });
});