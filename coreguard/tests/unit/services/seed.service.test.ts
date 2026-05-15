import { SeedService } from '@/server/services/seed.service';

describe('Seed service — determinism', () => {
  const fixedSeed = 'deterministic-test-2025';

  it('produces identical data across two seeds with same seed', () => {
    const service1 = new SeedService(fixedSeed);
    const service2 = new SeedService(fixedSeed);

    const { rng: rng1 } = service1 as unknown as { rng: () => number };
    const { rng: rng2 } = service2 as unknown as { rng: () => number };

    for (let i = 0; i < 100; i++) {
      expect(rng1()).toEqual(rng2());
    }
  });

  it('produces different data with different seeds', () => {
    const service1 = new SeedService(fixedSeed);
    const service2 = new SeedService('different-seed');

    const { rng: rng1 } = service1 as unknown as { rng: () => number };
    const { rng: rng2 } = service2 as unknown as { rng: () => number };

    const values1 = Array.from({ length: 10 }, () => rng1());
    const values2 = Array.from({ length: 10 }, () => rng2());

    expect(values1.join(',')).not.toEqual(values2.join(','));
  });
});