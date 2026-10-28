import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// 1. Generate a single-use token valid for up to 15 minutes
export async function POST(req: Request) {
  try {
    const { dealId, userDiscordId } = await req.json();

    if (!dealId || !userDiscordId) {
      return NextResponse.json({ error: 'Missing dealId or userDiscordId' }, { status: 400 });
    }

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Only allow download if deal is completed, or if creator is inspecting their own asset
    const isCompleted = deal.status === 'COMPLETED';
    const isCreator = deal.creator_discord_id === userDiscordId;
    const isBuyer = deal.partner_discord_id === userDiscordId;

    if (!isCreator && (!isBuyer || !isCompleted)) {
      return NextResponse.json({ error: 'Unauthorized download access' }, { status: 403 });
    }

    // Extract file path from publicUrl
    const urlParts = deal.file_url.split('/deliverables/');
    const rawFilePath = urlParts.length > 1 ? urlParts[1] : '';

    if (!rawFilePath) {
      return NextResponse.json({ error: 'Asset path not found' }, { status: 404 });
    }

    // 15-minute expiry token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('download_tokens')
      .insert([
        {
          deal_id: deal.id,
          token,
          user_discord_id: userDiscordId,
          file_path: rawFilePath,
          expires_at: expiresAt,
          is_used: false,
        },
      ]);

    if (insertError) throw insertError;

    const requestOrigin = new URL(req.url).origin;
    const siteUrl = requestOrigin.includes('localhost')
      ? 'https://roblox-os.vercel.app'
      : requestOrigin;

    const downloadLink = `${siteUrl}/api/download-asset?token=${token}`;

    return NextResponse.json({ downloadLink, expiresAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Consume token (Invalidates immediately upon first use or past 15 mins)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing download token.', { status: 400 });
  }

  const { data: record, error: findError } = await supabase
    .from('download_tokens')
    .select('*, deals(file_name)')
    .eq('token', token)
    .single();

  if (findError || !record) {
    return new NextResponse(
      renderErrorPage('Invalid Token', 'This download token does not exist or has expired.'),
      { headers: { 'Content-Type': 'text/html' }, status: 404 }
    );
  }

  if (record.is_used) {
    return new NextResponse(
      renderErrorPage('Token Already Used', 'This is a single-use download link and has already been consumed. Request a fresh link from your deal room.'),
      { headers: { 'Content-Type': 'text/html' }, status: 410 }
    );
  }

  if (new Date(record.expires_at) < new Date()) {
    return new NextResponse(
      renderErrorPage('Token Expired', 'This download link expired after 15 minutes. Generate a new link in your middleman deal room.'),
      { headers: { 'Content-Type': 'text/html' }, status: 410 }
    );
  }

  // Atomically mark token as used
  await supabase
    .from('download_tokens')
    .update({ is_used: true })
    .eq('id', record.id);

  // Generate a signed storage download URL valid for 60 seconds to stream file
  const { data: signedData, error: signError } = await supabase
    .storage
    .from('deliverables')
    .createSignedUrl(record.file_path, 60);

  if (signError || !signedData?.signedUrl) {
    return new NextResponse('Failed to generate secure asset stream.', { status: 500 });
  }

  return NextResponse.redirect(signedData.signedUrl);
}

function renderErrorPage(title: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background-color: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2rem; max-width: 420px; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔒</div>
          <h1 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem 0;">${title}</h1>
          <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.25rem;">
            ${message}
          </p>
          <a href="/middleman" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 700;">Back to Middleman</a>
        </div>
      </body>
    </html>
  `;
}