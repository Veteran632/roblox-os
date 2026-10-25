import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { dealCode, buyerRobloxId } = await req.json();

    if (!dealCode || !buyerRobloxId) {
      return NextResponse.json({ error: 'Missing dealCode or buyerRobloxId' }, { status: 400 });
    }

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('code', dealCode.trim().toUpperCase())
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const passId = deal.gamepass_id;
    if (!passId) {
      return NextResponse.json({ error: 'Deal has no Gamepass ID attached' }, { status: 400 });
    }

    // Query official Roblox Inventory API
    const robloxApiUrl = `https://inventory.roblox.com/v1/users/${buyerRobloxId}/items/1/${passId}/is-owned`;
    const checkRes = await fetch(robloxApiUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!checkRes.ok) {
      return NextResponse.json(
        { error: 'Could not reach Roblox inventory API. Make sure your Roblox inventory is set to Public in your privacy settings!' },
        { status: 502 }
      );
    }

    const isOwned = await checkRes.json();

    if (isOwned !== true) {
      return NextResponse.json(
        { 
          verified: false, 
          message: 'Roblox inventory says you do not own the pass yet. Buy it on Roblox first!' 
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('deals')
      .update({ status: 'COMPLETED' })
      .eq('id', deal.id);

    if (updateError) throw updateError;

    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;

    if (webhookUrl) {
      const payload = {
        content: staffRoleId
          ? `<@&${staffRoleId}> ✅ **[MIDDLEMAN COMPLETED] Pass Bought & Asset Unlocked!**`
          : `✅ **[MIDDLEMAN COMPLETED] Pass Bought & Asset Unlocked!**`,
        embeds: [
          {
            title: `Deal Completed: ${deal.code}`,
            description: `Pass purchase confirmed on Roblox. The asset file has been unlocked for the buyer!`,
            color: 0x10b981,
            fields: [
              { name: 'Commission', value: deal.title, inline: true },
              { name: 'Price', value: `${deal.amount} R$`, inline: true },
              { name: 'Developer', value: `${deal.creator_discord_username} (@${deal.creator_roblox_username || 'N/A'})`, inline: true },
              { name: 'Buyer Roblox ID', value: String(buyerRobloxId), inline: true },
              { name: 'Delivered Asset', value: deal.file_name, inline: false },
              { name: 'Download Link', value: `[Direct File Link](${deal.file_url})`, inline: false },
            ],
            footer: { text: 'Roblox OS Middleman' },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    return NextResponse.json({ verified: true, status: 'COMPLETED' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}