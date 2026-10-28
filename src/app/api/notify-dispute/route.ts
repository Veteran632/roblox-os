import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { dealCode, title, flaggedBy, reason, fileUrl, proofUrl } = await req.json();
    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;

    if (!proofUrl) {
      return NextResponse.json({ error: 'Compulsory dispute proof is required.' }, { status: 400 });
    }

    const requestOrigin = new URL(req.url).origin;
    const siteUrl = requestOrigin.includes('localhost')
      ? 'https://roblox-os.vercel.app'
      : requestOrigin;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not set' }, { status: 500 });
    }

    const forceReleaseUrl = `${siteUrl}/api/dispute-action?code=${dealCode}&action=FORCE_RELEASE`;
    const cancelDealUrl = `${siteUrl}/api/dispute-action?code=${dealCode}&action=CANCEL_DEAL`;

    const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(proofUrl);

    const embed: any = {
      title: `Dispute Case: Deal ${dealCode}`,
      description: `A participant flagged this deal with attached proof. Action is required from platform staff.`,
      color: 0xef4444,
      fields: [
        { name: 'Commission', value: title, inline: true },
        { name: 'Flagged By', value: flaggedBy, inline: true },
        { name: 'Report Reason', value: reason || 'Participant flagged for staff intervention.', inline: false },
        { name: 'Attached Proof (Compulsory)', value: `[📸 Open Uploaded Evidence](${proofUrl})`, inline: true },
        { name: 'Inspect Studio Asset', value: `[📦 Direct .rbxl Inspection](${fileUrl})`, inline: true },
        {
          name: 'Staff Resolution Decisions',
          value: `[🔓 Force-Unlock Asset for Buyer](${forceReleaseUrl})\n[🚫 Cancel Deal & Purge Room](${cancelDealUrl})`,
          inline: false,
        },
      ],
      footer: { text: 'Roblox OS Dispute Mediation • Proof Verified' },
      timestamp: new Date().toISOString(),
    };

    if (isImage) {
      embed.image = { url: proofUrl };
    }

    const payload = {
      content: staffRoleId
        ? `<@&${staffRoleId}> 🚨 **MIDDLEMAN DEAL FLAGGED WITH PROOF!**`
        : `🚨 **MIDDLEMAN DEAL FLAGGED WITH PROOF!**`,
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: '📸 View Dispute Proof',
              url: proofUrl,
            },
            {
              type: 2,
              style: 5,
              label: '🔓 Force-Unlock Asset',
              url: forceReleaseUrl,
            },
            {
              type: 2,
              style: 5,
              label: '🚫 Cancel Deal',
              url: cancelDealUrl,
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