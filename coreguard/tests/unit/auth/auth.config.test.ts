describe('Auth configuration — signout callback URL', () => {
  it('signIn page is set to /login (relative path)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const authFile = fs.readFileSync(
      path.join(process.cwd(), 'src/auth.ts'),
      'utf-8',
    );

    expect(authFile).toContain("signIn: '/login'");
  });

  it('signout callbackUrl uses NEXT_PUBLIC_BASE_URL env var', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const headerFile = fs.readFileSync(
      path.join(process.cwd(), 'src/components/layout/Header.tsx'),
      'utf-8',
    );

    expect(headerFile).toContain('NEXT_PUBLIC_BASE_URL');
    expect(headerFile).toContain('/login');
  });

  it('env files define NEXT_PUBLIC_BASE_URL for signout callback', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const envExample = fs.readFileSync(
      path.join(process.cwd(), '.env.example'),
      'utf-8',
    );
    const envLocal = fs.readFileSync(
      path.join(process.cwd(), '.env.local'),
      'utf-8',
    );

    expect(envExample).toContain('NEXT_PUBLIC_BASE_URL=');
    expect(envLocal).toContain('NEXT_PUBLIC_BASE_URL=');
  });

  it('env files do not hardcode active NEXTAUTH_URL (commented out)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const envExample = fs.readFileSync(
      path.join(process.cwd(), '.env.example'),
      'utf-8',
    );
    const envLocal = fs.readFileSync(
      path.join(process.cwd(), '.env.local'),
      'utf-8',
    );

    const activeNextAuthUrl = (content: string) =>
      content
        .split('\n')
        .filter((line) => line.startsWith('NEXTAUTH_URL='));

    expect(activeNextAuthUrl(envExample)).toHaveLength(0);
    expect(activeNextAuthUrl(envLocal)).toHaveLength(0);
  });

  it('SessionProvider is in root layout (not duplicated in sub-layouts)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const rootLayout = fs.readFileSync(
      path.join(process.cwd(), 'src/app/layout.tsx'),
      'utf-8',
    );
    const authLayout = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(auth)/layout.tsx'),
      'utf-8',
    );
    const consoleShell = fs.readFileSync(
      path.join(process.cwd(), 'src/components/layout/ConsoleShell.tsx'),
      'utf-8',
    );

    expect(rootLayout).toContain('SessionProvider');
    expect(authLayout).not.toContain('SessionProvider');
    expect(consoleShell).not.toContain('SessionProvider');
  });
});
