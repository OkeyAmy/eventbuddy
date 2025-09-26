import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Discord bot invite URL with necessary permissions
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID';
    const permissions = '8'; // Administrator permissions for full bot functionality
    // Include identify so we can fetch the installing user's id/name via the callback
    const scopes = 'bot applications.commands identify';
    
    // Always use the explicit OAuth callback endpoint
    const redirectUri = process.env.DISCORD_REDIRECT_URI || (
      process.env.NODE_ENV === 'production'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord-callback`
        : 'http://localhost:3000/api/auth/discord-callback'
    );

    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=${permissions}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=consent`;

    res.status(200).json({ inviteUrl });
  } catch (error) {
    console.error('Error generating bot invite URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate invite URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}