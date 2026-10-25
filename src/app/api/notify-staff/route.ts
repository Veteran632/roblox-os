import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { dealCode, title, fileName, fileUrl, requestedBy } = await req.json();
    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;
    
    // Always use live domain in production
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roblox-os.vercel.app';

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not set' }, { status: 500 });
    }

    const approveUrl = `${siteUrl}/api/staff-review?code=${dealCode}&action=APPROVED`;
    const rejectUrl = `${siteUrl}/api/staff-review?code=${dealCode}&action=REJECTED`;

    const payload = {
      content: staffRoleId
        ? `<@&${staffRoleId}> 🚨 **New File Check Request!**`
        : `🚨 **New File Check Request!**`,
      embeds: [
        {
          title: `File Check Request: ${dealCode}`,
          description: `A user asked staff to check this asset for backdoors, empty baseplates, or stolen scripts.`,
          color: 0xf59e0b,
          fields: [
            { name: 'Commission', value: title, inline: true },
            { name: 'Requested By', value: requestedBy, inline: true },
            { name: 'Asset File', value: fileName, inline: false },
            { name: 'Download File', value: `[Direct .rbxl Download](${fileUrl})`, inline: false },
            { 
              name: 'Staff Action', 
              value: `[✅ Approve Asset](${approveUrl}) • [❌ Reject Asset](${rejectUrl})`, 
              inline: false 
            },
          ],
          footer: { text: 'Roblox OS • Middleman Safety' },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Inspect Asset (.rbxl)',
              url: fileUrl,
            },
            {
              type: 2,
              style: 5,
              label: '✅ Approve Asset',
              url: approveUrl,
            },
            {
              type: 2,
              style: 5,
              label: '❌ Reject Asset',
              url: rejectUrl,
            },
          ],
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