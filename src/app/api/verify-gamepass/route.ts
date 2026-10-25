import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { dealCode, buyerRobloxId } = await req.json();

    if (!dealCode || !buyerRobloxId) {
      return NextResponse.json({ error: 'Missing dealCode or buyerRobloxId' }, { status: 400 });
    }

    // 1. Fetch deal details
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
      return NextResponse.json({ error: 'Deal does not have a Gamepass ID configured' }, { status: 400 });
    }

    // 2. Query official Roblox Inventory API to verify user owns the Gamepass
    // ItemType 1 = GamePass
    const robloxApiUrl = `https://inventory.roblox.com/v1/users/${buyerRobloxId}/items/1/${passId}/is-owned`;
    const checkRes = await fetch(robloxApiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!checkRes.ok) {
      return NextResponse.json({ error: 'Failed to query Roblox inventory API. Check if your inventory privacy is public.' }, { status: 502 });
    }

    const isOwned = await checkRes.json();

    if (isOwned !== true) {
      return NextResponse.json({ 
        verified: false, 
        message: 'Roblox inventory check returned false. Make sure the pass was bought and your inventory is visible.' 
      }, { status: 400 });
    }

    // 3. Mark Deal Completed in Supabase
    const { error: updateError } = await supabase
      .from('deals')
      .update({ status: 'COMPLETED' })
      .eq('id', deal.id);

    if (updateError) throw updateError;

    // 4. Send Staff Audit Discord Log
    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;

    if (webhookUrl) {
      const payload = {
        content: staffRoleId
          ? `<@&${staffRoleId}> ✅ **[ESCROW VERIFIED] Gamepass Ownership Confirmed!**`
          : `✅ **[ESCROW VERIFIED] Gamepass Ownership Confirmed!**`,
        embeds: [
          {
            title: `Deal Verified & Released: ${deal.code}`,
            description: `Official Roblox Inventory API confirmed ownership of Gamepass ID \`${passId}\`. Deliverable has been unlocked for the client.`,
            color: 0x10b981,
            fields: [
              { name: 'Commission', value: deal.title, inline: true },
              { name: 'Amount Paid', value: `${deal.amount} R$`, inline: true },
              { name: 'Developer', value: `${deal.creator_discord_username} (@${deal.creator_roblox_username || 'N/A'})`, inline: true },
              { name: 'Client Roblox ID', value: String(buyerRobloxId), inline: true },
              { name: 'File Delivered', value: deal.file_name, inline: false },
              { name: 'File URL', value: `[Direct File Link](${deal.file_url})`, inline: false },
            ],
            footer: { text: 'Roblox OS • Public API Verification Ledger' },
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