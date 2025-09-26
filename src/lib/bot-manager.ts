// NOTE: original import kept but commented out for traceability
// import { EventBuddyBot, type BotConfig } from './discord-bot';
// Switched to fixed implementation for testing/debugging — do not remove the old import yet
import { EventBuddyBot, type BotConfig } from './discord-bot-fixed';

class BotManager {
  private static instance: BotManager;
  private bot: EventBuddyBot | null = null;
  private config: BotConfig | null = null;

  private constructor() {}

  static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  async initialize(config: BotConfig): Promise<void> {
    if (this.bot) {
      console.warn('Bot already initialized. Stopping existing instance...');
      await this.stop();
    }

    this.config = config;
    this.bot = new EventBuddyBot(config);
    
    try {
      await this.bot.start(config.token);
      console.log('✅ EventBuddy bot manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize bot:', error);
      this.bot = null;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
      this.bot = null;
      console.log('🛑 Bot manager stopped');
    }
  }

  isRunning(): boolean {
    return this.bot !== null;
  }

  getConfig(): BotConfig | null {
    return this.config;
  }

  async restart(): Promise<void> {
    if (this.config) {
      await this.stop();
      await this.initialize(this.config);
    } else {
      throw new Error('No configuration available for restart');
    }
  }
}

export default BotManager;