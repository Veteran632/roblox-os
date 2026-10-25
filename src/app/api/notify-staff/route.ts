import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { dealCode, title, fileName, fileUrl, requestedBy } = await req.json();
    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roblox-os.vercel.app';

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not set' }, { status: 500 });
    }

    const approveUrl = `${siteUrl}/api/staff-review?code=${dealCode}&action=APPROVED`;
    const rejectUrl = `${siteUrl}/api/staff-review?code=${dealCode}&action=REJECTED`;

    const payload = {
      content: staffRoleId
        ? `<@&${staffRoleId}> 🚨 **New Studio File Verification Request!**`
        : `🚨 **New Studio File Verification Request!**`,
      embeds: [
        {
          title: `File Verification Request: ${dealCode}`,
          description: `A participant requested staff to review this deliverable for empty baseplates, backdoors, or malicious scripts.`,
          color: 0xf59e0b,
          fields: [
            { name: 'Commission', value: title, inline: true },
            { name: 'Requested By', value: requestedBy, inline: true },
            { name: 'File Asset', value: fileName, inline: false },
            { name: 'Inspect Deliverable', value: `[Direct .rbxl Download](${fileUrl})`, inline: false },
            { 
              name: 'Staff Moderation Actions', 
              value: `[✅ Approve Deliverable](${approveUrl}) • [❌ Reject Deliverable](${rejectUrl})`, 
              inline: false 
            },
          ],
          footer: { text: 'Roblox OS Security Ledger' },
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
              label: 'Inspect File (.rbxl)',
              url: fileUrl,
            },
            {
              type: 2,
              style: 5,
              label: '✅ Approve File',
              url: approveUrl,
            },
            {
              type: 2,
              style: 5,
              label: '❌ Reject File',
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