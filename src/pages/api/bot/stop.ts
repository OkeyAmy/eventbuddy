
import { NextApiRequest, NextApiResponse } from 'next';
import BotManager from '@/lib/bot-manager';

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
    console.log('🛑 Stopping Discord bot from API endpoint...');
    const botManager = BotManager.getInstance();
    await botManager.stop();

    console.log('✅ Bot stopped successfully');
    res.status(200).json({
      message: 'Bot stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to stop bot:', error);
    res.status(500).json({
      error: 'Failed to stop bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
