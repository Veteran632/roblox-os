import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function sendDiscordDM(botToken: string, userId: string, messageContent: string, embed: any) {
  try {
    // 1. Create DM channel with the recipient
    const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    if (!dmChannelRes.ok) return;
    const dmChannel = await dmChannelRes.json();

    // 2. Dispatch DM payload
    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageContent,
        embeds: [embed],
      }),
    });
  } catch (e) {
    console.error(`Failed to DM user ${userId}:`, e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const action = searchParams.get('action'); // 'APPROVED' or 'REJECTED'

  if (!code || (action !== 'APPROVED' && action !== 'REJECTED')) {
    return new NextResponse('Invalid request parameters.', { status: 400 });
  }

  // 1. Fetch deal record
  const { data: deal, error: findError } = await supabase
    .from('deals')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (findError || !deal) {
    return new NextResponse('Deal record not found.', { status: 404 });
  }

  // 2. Update status in database
  const nextStatus = action === 'APPROVED' ? 'AWAITING_LOCK' : 'DISPUTED';
  const staffVerified = action === 'APPROVED';

  const { error: updateError } = await supabase
    .from('deals')
    .update({
      staff_verified: staffVerified,
      staff_review_result: action,
      status: nextStatus,
    })
    .eq('id', deal.id);

  if (updateError) {
    return new NextResponse('Failed to update deal record.', { status: 500 });
  }

  // 3. Dispatch automated Discord DMs to both users
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roblox-os.vercel.app';
  const dealRoomUrl = `${siteUrl}/middleman`;

  if (botToken) {
    const isApproved = action === 'APPROVED';
    const statusText = isApproved ? 'Passed Staff Inspection ✅' : 'Rejected by Staff ❌';
    const dmColor = isApproved ? 0x10b981 : 0xef4444;

    const dmEmbed = {
      title: `Staff File Inspection: ${statusText}`,
      description: isApproved
        ? `Platform staff reviewed the Studio deliverable for **${deal.title}** and confirmed it is legitimate. Escrow is safe to complete.`
        : `Platform staff inspected **${deal.title}** and flagged anomalies. The contract is currently frozen under review.`,
      color: dmColor,
      fields: [
        { name: 'Room Code', value: deal.code, inline: true },
        { name: 'File Asset', value: deal.file_name, inline: true },
        { name: 'Return to Room', value: `[Open Deal Room](${dealRoomUrl})`, inline: false },
      ],
      footer: { text: 'Roblox OS Security Guard' },
      timestamp: new Date().toISOString(),
    };

    const notificationMessage = `Your deal **${deal.code}** has been updated by Platform Staff.`;

    if (deal.creator_discord_id) {
      await sendDiscordDM(botToken, deal.creator_discord_id, notificationMessage, dmEmbed);
    }
    if (deal.partner_discord_id) {
      await sendDiscordDM(botToken, deal.partner_discord_id, notificationMessage, dmEmbed);
    }
  }

  // Return HTML confirmation for staff
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Inspection Processed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background-color: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2.5rem; max-width: 440px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">${action === 'APPROVED' ? '✅' : '❌'}</div>
          <h1 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem 0;">Deal ${action}</h1>
          <p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem;">
            Deal <strong>${deal.code}</strong> has been updated. Realtime state applied to the room and DMs have been dispatched to both parties.
          </p>
          <a href="${dealRoomUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 700;">Open Dashboard</a>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}