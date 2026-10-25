import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1. Let the Roblox Hub Game look up a Deal Code to get the Gamepass ID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing deal code' }, { status: 400 });
  }

  const { data: deal, error } = await supabase
    .from('deals')
    .select('code, title, amount, gamepass_id, status, creator_roblox_username, partner_roblox_username')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (error || !deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  return NextResponse.json(deal);
}

// 2. Auto-Release Files & Ping Staff Webhook when Gamepass is bought in-game
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedSecret = process.env.ROBLOX_API_SECRET || 'super_secret_hub_key_999';

    if (apiKey !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized Roblox Server' }, { status: 401 });
    }

    const { dealCode, buyerRobloxId, buyerRobloxUsername, gamePassId } = await req.json();

    const { data: deal, error: findError } = await supabase
      .from('deals')
      .select('*')
      .eq('code', dealCode.trim().toUpperCase())
      .single();

    if (findError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Verify the Gamepass bought matches the deal's Gamepass ID
    if (deal.gamepass_id && String(deal.gamepass_id) !== String(gamePassId)) {
      return NextResponse.json({ error: 'Gamepass ID mismatch' }, { status: 400 });
    }

    // Auto-Release the deal so the Client can immediately download the .rbxl file!
    const { error: updateError } = await supabase
      .from('deals')
      .update({ status: 'COMPLETED' })
      .eq('id', deal.id);

    if (updateError) throw updateError;

    // Ping Staff Discord Webhook purely for transaction logging
    const webhookUrl = process.env.DISCORD_STAFF_WEBHOOK_URL;
    const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;

    if (webhookUrl) {
      const payload = {
        content: staffRoleId
          ? `<@&${staffRoleId}> ✅ **[AUTO-RELEASE LOG] In-Game Payment Confirmed!**`
          : `✅ **[AUTO-RELEASE LOG] In-Game Payment Confirmed!**`,
        embeds: [
          {
            title: `Deal Auto-Released: ${deal.code}`,
            description: `The Client purchased the Gamepass inside the Roblox Hub experience. The Studio file (\`${deal.file_name}\`) has been automatically unlocked for the Client.`,
            color: 0x10b981,
            fields: [
              { name: 'Commission', value: deal.title, inline: true },
              { name: 'Price (10% Cut Taken)', value: `${deal.amount} R$`, inline: true },
              { name: 'Gamepass ID', value: String(gamePassId), inline: true },
              { name: 'Developer', value: `${deal.creator_discord_username} (@${deal.creator_roblox_username || 'N/A'})`, inline: true },
              { name: 'Buyer (Roblox)', value: `@${buyerRobloxUsername} (${buyerRobloxId})`, inline: true },
              { name: 'Delivered File Log', value: `[${deal.file_name}](${deal.file_url})`, inline: false },
            ],
            footer: { text: 'Roblox OS • Automated In-Game Settlement Log' },
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

    return NextResponse.json({ success: true, status: 'COMPLETED' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}