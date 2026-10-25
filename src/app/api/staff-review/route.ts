import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function sendDiscordDM(botToken: string, userId: string, messageContent: string, embed: any) {
  try {
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

  const { data: deal, error: findError } = await supabase
    .from('deals')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (findError || !deal) {
    return new NextResponse('Deal not found.', { status: 404 });
  }

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
    return new NextResponse('Failed to update deal.', { status: 500 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  // Force live Vercel URL so DMs never link to localhost
  const requestOrigin = new URL(req.url).origin;
  const siteUrl = requestOrigin.includes('localhost') 
    ? 'https://roblox-os.vercel.app' 
    : requestOrigin;
  const dealRoomUrl = `${siteUrl}/middleman`;

  if (botToken) {
    const isApproved = action === 'APPROVED';
    const statusText = isApproved ? 'File Checked & Approved ✅' : 'File Flagged by Staff ❌';
    const dmColor = isApproved ? 0x10b981 : 0xef4444;

    const dmEmbed = {
      title: `Middleman Update: ${statusText}`,
      description: isApproved
        ? `Staff opened and checked the Studio file for **${deal.title}**. Everything looks clean and safe to buy!`
        : `Staff checked **${deal.title}** and found an issue. The deal is currently on hold.`,
      color: dmColor,
      fields: [
        { name: 'Deal Code', value: deal.code, inline: true },
        { name: 'Asset Name', value: deal.file_name, inline: true },
        { name: 'Back to Middleman Room', value: `[Click here to view deal](${dealRoomUrl})`, inline: false },
      ],
      footer: { text: 'Roblox OS Middleman' },
      timestamp: new Date().toISOString(),
    };

    const notificationMessage = `Hey! Your deal **${deal.code}** was reviewed by staff.`;

    if (deal.creator_discord_id) {
      await sendDiscordDM(botToken, deal.creator_discord_id, notificationMessage, dmEmbed);
    }
    if (deal.partner_discord_id) {
      await sendDiscordDM(botToken, deal.partner_discord_id, notificationMessage, dmEmbed);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Asset Review Complete</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background-color: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2.5rem; max-width: 440px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">${action === 'APPROVED' ? '✅' : '❌'}</div>
          <h1 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem 0;">Asset ${action}</h1>
          <p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem;">
            Deal <strong>${deal.code}</strong> updated! Both users were just sent a DM on Discord with the link to return to the room.
          </p>
          <a href="${dealRoomUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 700;">Back to Dashboard</a>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}