import { posts, users, type Post, type InsertPost, type ScheduleConfig, type InsertScheduleConfig, type User, type InsertUser } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { log } from "./vite";
import session from "express-session";
import createMemoryStore from "memorystore";
import { ACTIVE_HOURS, isWithinActiveHours } from "./services/scheduler";

const MemoryStore = createMemoryStore(session);

const DATA_FILE = process.env.NODE_ENV === "production" 
  ? "/data/state.json"
  : path.join(process.cwd(), "data/state.json");

export interface IStorage {
  getAllPosts(): Promise<Post[]>;
  getNextUnpostedItem(): Promise<Post | undefined>;
  markAsPosted(id: number): Promise<void>;
  markAsFailed(id: number, error: string): Promise<void>;
  markAsSkipped(id: number): Promise<void>;
  initializeFromJson(filePath: string): Promise<void>;
  clearErrors(): Promise<void>;

  // Schedule methods
  saveScheduleConfig(config: InsertScheduleConfig): Promise<ScheduleConfig>;
  getActiveScheduleConfig(): Promise<ScheduleConfig | undefined>;
  updatePostScheduledTimes(interval: number): Promise<void>;
  getPostsByStatus(posted: boolean): Promise<Post[]>;
  markAllAsSkipped(): Promise<void>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  setResetToken(email: string, token: string): Promise<void>;
  verifyResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, newPassword: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private posts: Map<number, Post>;
  private users: Map<number, User>;
  private currentId: number;
  private currentUserId: number;
  private scheduleConfig?: ScheduleConfig;
  readonly sessionStore: session.Store;

  constructor() {
    log('Initializing MemStorage...', 'storage');
    this.posts = new Map();
    this.users = new Map();
    this.currentId = 1;
    this.currentUserId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    this.loadState();
    log('MemStorage initialized successfully', 'storage');
  }

  private async saveState() {
    try {
      const state = {
        posts: Array.from(this.posts.values()),
        users: Array.from(this.users.values()),
        currentId: this.currentId,
        currentUserId: this.currentUserId,
        scheduleConfig: this.scheduleConfig
      };
      
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2));
      log('State saved successfully', 'storage');
    } catch (error: any) {
      log(`Failed to save state: ${error.message}`, 'storage');
    }
  }

  private async loadState() {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      const state = JSON.parse(data);
      
      this.posts = new Map(state.posts.map((post: Post) => [post.id, {
        ...post,
        scheduledTime: post.scheduledTime ? new Date(post.scheduledTime) : null,
        postedAt: post.postedAt ? new Date(post.postedAt) : null
      }]));
      this.users = new Map(state.users.map((user: User) => [user.id, user]));
      this.currentId = state.currentId;
      this.currentUserId = state.currentUserId;
      this.scheduleConfig = state.scheduleConfig ? {
        ...state.scheduleConfig,
        startTime: new Date(state.scheduleConfig.startTime),
        endTime: new Date(state.scheduleConfig.endTime)
      } : undefined;
      
      log('State loaded successfully', 'storage');
    } catch (error: any) {
      log(`No existing state found or failed to load: ${error.message}`, 'storage');
    }
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async getNextUnpostedItem(): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(
      (post) => !post.posted && !post.error && !post.skipped
    );
  }

  async markAsPosted(id: number): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.posted = true;
      post.postedAt = new Date();
      this.posts.set(id, post);
      await this.saveState();
    }
  }

  async markAsFailed(id: number, error: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.error = error;
      this.posts.set(id, post);
      await this.saveState();
    }
  }

  async markAsSkipped(id: number): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.skipped = true;
      this.posts.set(id, post);
      await this.saveState();
    }
  }

  async clearErrors(): Promise<void> {
    log('Clearing error states from all posts', 'storage');
    for (const [id, post] of this.posts.entries()) {
      if (post.error) {
        this.posts.set(id, {
          ...post,
          error: null,
        });
      }
    }
    await this.saveState();
  }

  async initializeFromJson(filePath: string): Promise<void> {
    try {
      log(`Reading JSON file from: ${filePath}`, 'storage');

      const data = await fs.readFile(filePath, 'utf-8');
      log(`File content length: ${data.length} characters`, 'storage');

      const cleanData = data.trim();
      log(`Cleaned data length: ${cleanData.length} characters`, 'storage');

      let listings;
      try {
        listings = JSON.parse(cleanData);
        log(`Successfully parsed JSON. Found ${listings.length} listings`, 'storage');
      } catch (parseError: any) {
        log(`JSON parse error: ${parseError.message}`, 'storage');
        throw parseError;
      }

      // Process each listing
      for (const listing of listings) {
        const post: Post = {
          id: this.currentId++,
          listingId: String(this.currentId - 1),
          name: listing.name,
          category: listing.category,
          location: listing.location,
          revenue: listing.revenue,
          monthlyProfit: listing.monthly_profit,
          profitMargin: listing.profit_margin,
          promoText: listing.promo_text,
          posted: false,
          postedAt: null,
          scheduledTime: null,
          error: null,
          skipped: false,
        };
        this.posts.set(post.id, post);
        log(`Added listing: ${post.name}`, 'storage');
      }

      log(`Successfully initialized ${this.posts.size} listings`, 'storage');
      await this.saveState();
    } catch (error: any) {
      const errorMessage = `Failed to initialize from JSON: ${error.message}`;
      log(errorMessage, 'storage');
      throw new Error(errorMessage);
    }
  }

  async saveScheduleConfig(config: InsertScheduleConfig): Promise<ScheduleConfig> {
    this.scheduleConfig = {
      id: 1,
      startTime: config.startTime,
      endTime: config.endTime,
      interval: config.interval,
      isActive: true
    };

    await this.updatePostScheduledTimes(config.interval);
    await this.saveState();
    return this.scheduleConfig;
  }

  async getActiveScheduleConfig(): Promise<ScheduleConfig | undefined> {
    return this.scheduleConfig;
  }

  async updatePostScheduledTimes(interval: number): Promise<void> {
    if (!this.scheduleConfig) return;

    const unpostedPosts = Array.from(this.posts.values())
      .filter(post => !post.posted && !post.skipped)
      .sort((a, b) => a.id - b.id);

    let scheduledTime = new Date(this.scheduleConfig.startTime);
    
    // Ensure we start during active hours
    if (scheduledTime.getHours() < ACTIVE_HOURS.start) {
      scheduledTime.setHours(ACTIVE_HOURS.start, 0, 0, 0);
    }

    for (const post of unpostedPosts) {
      if (scheduledTime <= new Date(this.scheduleConfig.endTime)) {
        // Skip non-active hours
        while (
          scheduledTime <= new Date(this.scheduleConfig.endTime) && 
          !isWithinActiveHours(scheduledTime)
        ) {
          // If outside active hours, jump to next day's start time
          if (scheduledTime.getHours() >= ACTIVE_HOURS.end) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
            scheduledTime.setHours(ACTIVE_HOURS.start, 0, 0, 0);
          } else {
            scheduledTime.setHours(ACTIVE_HOURS.start, 0, 0, 0);
          }
        }

        // If we're still within the overall schedule window
        if (scheduledTime <= new Date(this.scheduleConfig.endTime)) {
          this.posts.set(post.id, {
            ...post,
            scheduledTime
          });
          scheduledTime = new Date(scheduledTime.getTime() + interval * 60000);
        }
      }
    }
    await this.saveState();
  }

  async getPostsByStatus(posted: boolean): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.posted === posted && !post.skipped)
      .sort((a, b) => {
        if (posted) {
          return (b.postedAt?.getTime() || 0) - (a.postedAt?.getTime() || 0);
        } else {
          return (a.scheduledTime?.getTime() || 0) - (b.scheduledTime?.getTime() || 0);
        }
      });
  }

  async markAllAsSkipped(): Promise<void> {
    for (const post of this.posts.values()) {
      if (!post.posted) {
        post.skipped = true;
      }
    }
    await this.saveState();
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      ...userData,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    await this.saveState();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async setResetToken(email: string, token: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (user) {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1); // Token expires in 1 hour

      this.users.set(user.id, {
        ...user,
        resetToken: token,
        resetTokenExpiry: expiry,
      });
      await this.saveState();
    }
  }

  async verifyResetToken(token: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (u) => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > new Date()
    );
    return user;
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, {
        ...user,
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });
      await this.saveState();
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
}

export const storage = new MemStorage();

// Initialize storage with JSON data only if the file exists
const jsonPath = path.join(process.cwd(), "attached_assets/Pasted--name-Wickly-nl-category-Ecommerce-Candle-Webshop-location-Nether-1741446888682.txt");

async function initializeStorageIfFileExists() {
  try {
    log('Checking for JSON data file...', 'storage');
    await fs.access(jsonPath);
    log('JSON data file found, initializing storage...', 'storage');
    await storage.initializeFromJson(jsonPath);
    log('Storage initialized successfully from JSON file', 'storage');
  } catch (error: any) {
    log(`Note: JSON data file not found or initialization skipped: ${error.message}`, 'storage');
    // Continue without initialization - this is not a fatal error
  }
}

// Initialize asynchronously without blocking server startup
initializeStorageIfFileExists().catch(error => {
  log(`Warning: Failed to initialize storage from JSON: ${error.message}`, 'storage');
  // Continue anyway - the storage is still usable for authentication
});