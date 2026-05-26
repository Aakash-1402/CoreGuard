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

  it('signout callbackUrl uses relative path /login (not hardcoded localhost)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const headerFile = fs.readFileSync(
      path.join(process.cwd(), 'src/components/layout/Header.tsx'),
      'utf-8',
    );

    expect(headerFile).toContain("callbackUrl: '/login'");
    expect(headerFile).not.toContain('localhost');
    expect(headerFile).not.toContain('http://');
    expect(headerFile).not.toContain('https://');
  });

  it('env files do not hardcode localhost for NEXTAUTH_URL', async () => {
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

  it('no NEXT_PUBLIC env var hardcodes signout callback URL', async () => {
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

    expect(envExample).not.toContain('NEXT_PUBLIC_AUTH_SIGNOUT');
    expect(envLocal).not.toContain('NEXT_PUBLIC_AUTH_SIGNOUT');
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
