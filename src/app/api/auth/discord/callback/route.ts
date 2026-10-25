import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/discord/callback`;

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId || '',
        client_secret: clientSecret || '',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to fetch access token');
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head><title>Authenticating...</title></head>
        <body style="background-color: #111318; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <p>Connecting Discord profile...</p>
          <script>
            const existingRaw = localStorage.getItem('auth_user');
            const existing = existingRaw ? JSON.parse(existingRaw) : {};
            const updated = {
              ...existing,
              id: "${userData.id}",
              username: "${userData.username}",
              avatar: "${userData.avatar || ''}"
            };
            localStorage.setItem('auth_user', JSON.stringify(updated));
            window.location.href = '/login';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url));
  }
}