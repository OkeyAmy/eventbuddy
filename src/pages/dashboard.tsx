import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const router = useRouter();
  const { user, id, guild_id, permissions } = router.query;
  const [botStatus, setBotStatus] = useState<{ running: boolean; hasConfig: boolean } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [guildSettings, setGuildSettings] = useState<any>(null);

  useEffect(() => {
    checkBotStatus();
    if (guild_id && id) {
      setupGuildSettings();
    }
  }, [guild_id, id]);

  const checkBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status');
      const data = await response.json();
      setBotStatus(data);
    } catch (error) {
      console.error('Failed to check bot status:', error);
    }
  };

  const setupGuildSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('guild_settings')
        .select('*')
        .eq('guild_id', guild_id as string)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching guild settings:', error);
        return;
      }

      if (!data) {
        // Create new guild settings
        const { data: newSettings, error: insertError } = await supabase
          .from('guild_settings')
          .insert({
            guild_id: guild_id as string,
            bot_added_by: id as string,
            analytics_enabled: true,
            tagging_mode: 'individual'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating guild settings:', insertError);
        } else {
          setGuildSettings(newSettings);
        }
      } else {
        setGuildSettings(data);
      }
    } catch (error) {
      console.error('Error setting up guild settings:', error);
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
          <h1 className="text-2xl font-bold text-white mb-4">🎉 Bot Authorization Successful!</h1>
          <p className="text-white/70 mb-6">EventBuddy has been added to your Discord server.</p>
          <div className="space-y-4">
            <p className="text-white/80">
              Check your server - the bot should now be online and ready to help with event management!
            </p>
            <Button onClick={() => router.push('/')} className="discord-button">
              Return Home
            </Button>
          </div>
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
              {guild_id && (
                <p className="text-white/60 text-sm">
                  Server ID: {guild_id}
                </p>
              )}
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

        {/* Server Settings */}
        {guildSettings && (
          <Card className="glass border-white/20 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">⚙️ Server Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-white font-medium">Analytics</label>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${guildSettings.analytics_enabled ? 'bg-success' : 'bg-destructive'}`}></div>
                  <span className="text-white/80">{guildSettings.analytics_enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-white font-medium">Tagging Mode</label>
                <span className="text-accent capitalize">{guildSettings.tagging_mode}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Start Guide */}
        <Card className="glass border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">🚀 Next Steps</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-white font-bold">✓</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Bot Added to Server</h3>
                <p className="text-white/70 text-sm">
                  EventBuddy is now active in your Discord server and ready to help!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Create Your Event</h3>
                <p className="text-white/70 text-sm">
                  Set up your event on Luma, Eventbrite, or any platform. Export attendee list with Discord handles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Import Attendees</h3>
                <p className="text-white/70 text-sm">
                  DM the bot or use a private admin channel with: <code className="bg-white/10 px-2 py-1 rounded text-accent">/import_event [Event Name] [Date] [Time] [Theme]</code>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Let AI Handle the Rest</h3>
                <p className="text-white/70 text-sm">
                  The bot will send pre-event reminders, create post-event channels, and provide analytics via DM!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-2xl">
            <h4 className="text-white font-semibold mb-2">📋 Available Commands</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/70 text-sm">
              <div>• <code className="bg-white/10 px-1 rounded">/import_event</code> - Import CSV</div>
              <div>• <code className="bg-white/10 px-1 rounded">/end_event</code> - Create networking</div>
              <div>• <code className="bg-white/10 px-1 rounded">/analytics</code> - View insights</div>
              <div>• <code className="bg-white/10 px-1 rounded">/help</code> - Get assistance</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;