describe('Project Setup', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify TypeScript compilation', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(2, 3)).toBe(5);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
