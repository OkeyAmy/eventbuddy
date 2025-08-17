import { NextApiRequest, NextApiResponse } from 'next';
import BotManager from '@/lib/bot-manager';
import { BotConfig } from '@/lib/discord-bot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config: BotConfig = {
      token: process.env.DISCORD_BOT_TOKEN!,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY!
    };

    // Validate required environment variables
    const missingVars = [];
    if (!config.token) missingVars.push('DISCORD_BOT_TOKEN');
    if (!config.supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!config.supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!config.geminiApiKey) missingVars.push('GEMINI_API_KEY');

    if (missingVars.length > 0) {
      return res.status(400).json({
        error: 'Missing required environment variables',
        missing: missingVars
      });
    }

    const botManager = BotManager.getInstance();
    await botManager.initialize(config);

    res.status(200).json({
      message: 'Bot started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({
      error: 'Failed to start bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}