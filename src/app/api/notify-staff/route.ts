import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { dealCode, title, fileName, fileUrl, requestedBy } = await req.json();
    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not set' }, { status: 500 });
    }

    const payload = {
      content: staffRoleId ? `<@&${staffRoleId}> 🚨 **New Studio File Verification Request!**` : `🚨 **New Studio File Verification Request!**`,
      embeds: [
        {
          title: `Deal Verification: ${dealCode}`,
          description: `A user has requested platform staff to open and verify a Roblox Studio deliverable to prevent empty baseplates or backdoors.`,
          color: 0x3b82f6,
          fields: [
            { name: 'Commission', value: title, inline: true },
            { name: 'Requested By', value: requestedBy, inline: true },
            { name: 'File Name', value: fileName, inline: false },
            { name: 'Download File (.rbxl)', value: `[Direct Download Link](${fileUrl})`, inline: false },
          ],
          footer: { text: 'Roblox OS Security Ledger' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}