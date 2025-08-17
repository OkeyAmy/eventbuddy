import { NextApiRequest, NextApiResponse } from 'next';
import BotManager from '@/lib/bot-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const botManager = BotManager.getInstance();
    const isRunning = botManager.isRunning();
    const config = botManager.getConfig();

    res.status(200).json({
      running: isRunning,
      hasConfig: !!config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking bot status:', error);
    res.status(500).json({ error: 'Failed to check bot status' });
  }
}