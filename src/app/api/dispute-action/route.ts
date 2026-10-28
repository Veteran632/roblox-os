import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function sendDiscordDM(botToken: string, userId: string, messageContent: string, embed: any, dealRoomUrl: string) {
  try {
    const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: userId.trim() }),
    });

    if (!dmChannelRes.ok) return;
    const dmChannel = await dmChannelRes.json();

    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageContent,
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'View Deal Room',
                url: dealRoomUrl,
              },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    console.error(`Failed to DM user ${userId}:`, e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const action = searchParams.get('action'); // 'FORCE_RELEASE' or 'CANCEL_DEAL'

  if (!code || (action !== 'FORCE_RELEASE' && action !== 'CANCEL_DEAL')) {
    return new NextResponse('Invalid dispute parameters.', { status: 400 });
  }

  const { data: deal, error: findError } = await supabase
    .from('deals')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (findError || !deal) {
    return new NextResponse('Deal not found.', { status: 404 });
  }

  const newStatus = action === 'FORCE_RELEASE' ? 'COMPLETED' : 'CANCELLED';

  const { error: updateError } = await supabase
    .from('deals')
    .update({
      status: newStatus,
      dispute_action: action,
    })
    .eq('id', deal.id);

  if (updateError) {
    return new NextResponse('Failed to apply dispute resolution.', { status: 500 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const requestOrigin = new URL(req.url).origin;
  const siteUrl = requestOrigin.includes('localhost')
    ? 'https://roblox-os.vercel.app'
    : requestOrigin;
  const dealRoomUrl = `${siteUrl}/middleman`;

  if (botToken) {
    const isReleased = action === 'FORCE_RELEASE';
    const embedColor = isReleased ? 0x10b981 : 0xef4444;
    const titleText = isReleased ? 'Dispute Resolved: Asset Unlocked 🔓' : 'Dispute Resolved: Deal Cancelled 🚫';
    const descText = isReleased
      ? `Staff investigated the dispute on **${deal.title}** and granted asset download access to the buyer.`
      : `Staff investigated the dispute on **${deal.title}** and closed the deal room. No asset was released.`;

    const dmEmbed = {
      title: titleText,
      description: descText,
      color: embedColor,
      fields: [
        { name: 'Deal Code', value: deal.code, inline: true },
        { name: 'Resolution Verdict', value: action, inline: true },
      ],
      footer: { text: 'Roblox OS Dispute Mediation' },
      timestamp: new Date().toISOString(),
    };

    const msg = `Dispute verdict reached for deal **${deal.code}**.`;

    if (deal.creator_discord_id) {
      await sendDiscordDM(botToken, deal.creator_discord_id, msg, dmEmbed, dealRoomUrl);
    }
    if (deal.partner_discord_id) {
      await sendDiscordDM(botToken, deal.partner_discord_id, msg, dmEmbed, dealRoomUrl);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dispute Resolved</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background-color: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2.5rem; max-width: 440px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">${action === 'FORCE_RELEASE' ? '🔓' : '🚫'}</div>
          <h1 style="font-size: 1.4rem; font-weight: 800; margin: 0 0 0.5rem 0;">Verdict Applied</h1>
          <p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem;">
            Deal <strong>${deal.code}</strong> updated to <strong>${newStatus}</strong>. DMs dispatched to both users.
          </p>
          <a href="${dealRoomUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 700;">Back to Dashboard</a>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}