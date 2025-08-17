import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Dashboard = () => {
  const router = useRouter();
  const { user, id } = router.query;
  const [botStatus, setBotStatus] = useState<{ running: boolean; hasConfig: boolean } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    checkBotStatus();
  }, []);

  const checkBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status');
      const data = await response.json();
      setBotStatus(data);
    } catch (error) {
      console.error('Failed to check bot status:', error);
    }
  };

  const startBot = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/bot/start', { method: 'POST' });
      if (response.ok) {
        await checkBotStatus();
      } else {
        const error = await response.json();
        console.error('Failed to start bot:', error);
      }
    } catch (error) {
      console.error('Error starting bot:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (!user || !id) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Access</h1>
          <p className="text-white/70 mb-6">Please complete the Discord OAuth flow.</p>
          <Button onClick={() => router.push('/')} className="discord-button">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {user}! 👋
              </h1>
              <p className="text-white/70">
                Discord ID: {id}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${botStatus?.running ? 'bg-success' : 'bg-destructive'}`}></div>
              <span className="text-white/80 text-sm">
                Bot {botStatus?.running ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Bot Status Card */}
        <Card className="glass border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🤖 Bot Status</h2>
          
          {botStatus === null ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Status:</span>
                <span className={`font-semibold ${botStatus.running ? 'text-success' : 'text-destructive'}`}>
                  {botStatus.running ? 'Running' : 'Stopped'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80">Configuration:</span>
                <span className={`font-semibold ${botStatus.hasConfig ? 'text-success' : 'text-destructive'}`}>
                  {botStatus.hasConfig ? 'Ready' : 'Missing'}
                </span>
              </div>

              {!botStatus.running && (
                <Button 
                  onClick={startBot} 
                  disabled={isStarting}
                  className="discord-button w-full mt-6"
                >
                  {isStarting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Bot...
                    </div>
                  ) : (
                    '🚀 Start EventBuddy Bot'
                  )}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Quick Start Guide */}
        <Card className="glass border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Quick Start Guide</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Invite Bot to Server</h3>
                <p className="text-white/70 text-sm">
                  Add EventBuddy to your Discord server with the necessary permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Create Event on Luma</h3>
                <p className="text-white/70 text-sm">
                  Set up your event on Luma or your preferred platform and collect RSVPs with Discord handles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Import Attendees</h3>
                <p className="text-white/70 text-sm">
                  Use <code className="bg-white/10 px-2 py-1 rounded text-accent">/import_event</code> in a private channel to upload your CSV with attendee Discord handles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div>
                <h3 className="text-white font-semibold mb-2">End Event & Network</h3>
                <p className="text-white/70 text-sm">
                  After your event, use <code className="bg-white/10 px-2 py-1 rounded text-accent">/end_event</code> to create a networking channel with AI icebreakers.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-2xl">
            <h4 className="text-white font-semibold mb-2">💡 Pro Tips</h4>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• All admin commands work only in DMs or private channels</li>
              <li>• CSV format: Name, Email, Discord Handle, Ticket Type, RSVP Status</li>
              <li>• Bot responds intelligently in post-event channels</li>
              <li>• Use <code className="bg-white/10 px-1 rounded">/analytics</code> to track engagement</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;