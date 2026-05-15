process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:6432/coreguard';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest-tests-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.SEED_FIXED_SEED = 'test-seed';
process.env.ALLOW_SEED = 'true';
process.env.LOG_LEVEL = 'silent';