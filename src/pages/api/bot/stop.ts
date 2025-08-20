
import { NextApiRequest, NextApiResponse } from 'next';
import BotManager from '@/lib/bot-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const botManager = BotManager.getInstance();
    await botManager.stop();

    res.status(200).json({
      message: 'Bot stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({
      error: 'Failed to stop bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
