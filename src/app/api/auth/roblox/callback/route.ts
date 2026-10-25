import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_roblox_code', request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/roblox/callback`;

  try {
    // 1. Exchange code for Roblox OAuth2 Token
    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
      throw new Error(tokenData.error_description || 'Failed to get Roblox token');
    }

    // 2. Fetch Roblox User Profile (User ID, Username, Display Name)
    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // 3. Merge Roblox account into existing auth_user in localStorage
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Linking Roblox...</title>
        </head>
        <body style="background-color: #111318; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <p>Connecting Roblox profile...</p>
          <script>
            const existingRaw = localStorage.getItem('auth_user');
            const existing = existingRaw ? JSON.parse(existingRaw) : {};
            const updated = {
              ...existing,
              robloxId: "${userData.sub}",
              robloxUsername: "${userData.preferred_username}",
              robloxDisplayName: "${userData.name || userData.preferred_username}"
            };
            localStorage.setItem('auth_user', JSON.stringify(updated));
            window.location.href = '/login';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url));
  }
}