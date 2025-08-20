
import { NextApiRequest, NextApiResponse } from 'next';
import BotManager from '@/lib/bot-manager';
import { BotConfig } from '@/lib/discord-bot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting EventBuddy bot from API endpoint...');

    const config: BotConfig = {
      token: process.env.DISCORD_BOT_TOKEN!,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY!
    };

    // Validate required environment variables
    const missingVars = [];
    if (!config.token) missingVars.push('DISCORD_BOT_TOKEN');
    if (!config.supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL');
    if (!config.supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!config.geminiApiKey) missingVars.push('GEMINI_API_KEY');
    if (!process.env.OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY');

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return res.status(400).json({
        error: 'Missing required environment variables',
        missing: missingVars
      });
    }

    console.log('✅ All environment variables found');
    console.log('📝 Config:', {
      hasToken: !!config.token,
      supabaseUrl: config.supabaseUrl,
      hasSupabaseKey: !!config.supabaseKey,
      hasGeminiKey: !!config.geminiApiKey
    });

    const botManager = BotManager.getInstance();
    await botManager.initialize(config);

    console.log('✅ Bot started successfully');

    res.status(200).json({
      message: 'EventBuddy bot started successfully',
      timestamp: new Date().toISOString(),
      config: {
        hasToken: !!config.token,
        supabaseUrl: config.supabaseUrl,
        hasSupabaseKey: !!config.supabaseKey,
        hasGeminiKey: !!config.geminiApiKey
      }
    });
  } catch (error) {
    console.error('❌ Error starting bot:', error);
    res.status(500).json({
      error: 'Failed to start bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
