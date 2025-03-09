import { posts, scheduleConfig, type Post, type InsertPost, type ScheduleConfig, type InsertScheduleConfig } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { log } from "./vite";

export interface IStorage {
  getAllPosts(): Promise<Post[]>;
  getNextUnpostedItem(): Promise<Post | undefined>;
  markAsPosted(id: number): Promise<void>;
  markAsFailed(id: number, error: string): Promise<void>;
  initializeFromJson(filePath: string): Promise<void>;
  clearErrors(): Promise<void>;

  // New scheduling methods
  saveScheduleConfig(config: InsertScheduleConfig): Promise<ScheduleConfig>;
  getActiveScheduleConfig(): Promise<ScheduleConfig | undefined>;
  updatePostScheduledTimes(interval: number): Promise<void>;
  getPostsByStatus(posted: boolean): Promise<Post[]>;
}

export class MemStorage implements IStorage {
  private posts: Map<number, Post>;
  private currentId: number;
  private scheduleConfig?: ScheduleConfig;

  constructor() {
    this.posts = new Map();
    this.currentId = 1;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async getNextUnpostedItem(): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(
      (post) => !post.posted && !post.error
    );
  }

  async markAsPosted(id: number): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      log(`Marking post ${id} as posted`, 'storage');
      this.posts.set(id, {
        ...post,
        posted: true,
        postedAt: new Date(),
        error: null, // Clear any previous errors
      });
    } else {
      log(`Post ${id} not found for marking as posted`, 'storage');
    }
  }

  async markAsFailed(id: number, error: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      log(`Marking post ${id} as failed: ${error}`, 'storage');
      this.posts.set(id, {
        ...post,
        error,
        posted: false,
        postedAt: null,
      });
    } else {
      log(`Post ${id} not found for marking as failed`, 'storage');
    }
  }

  // Clear error state from all posts before attempting a new post
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
  }

  async initializeFromJson(filePath: string): Promise<void> {
    try {
      log(`Reading JSON file from: ${filePath}`, 'storage');

      // Read the file content
      const data = await fs.readFile(filePath, 'utf-8');
      log(`File content length: ${data.length} characters`, 'storage');

      // Clean the data and parse JSON
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
          error: null,
        };
        this.posts.set(post.id, post);
        log(`Added listing: ${post.name}`, 'storage');
      }

      log(`Successfully initialized ${this.posts.size} listings`, 'storage');
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

    // Update scheduled times for all posts
    await this.updatePostScheduledTimes(config.interval);

    return this.scheduleConfig;
  }

  async getActiveScheduleConfig(): Promise<ScheduleConfig | undefined> {
    return this.scheduleConfig;
  }

  async updatePostScheduledTimes(interval: number): Promise<void> {
    if (!this.scheduleConfig) return;

    const unpostedPosts = Array.from(this.posts.values())
      .filter(post => !post.posted)
      .sort((a, b) => a.id - b.id);

    let scheduledTime = new Date(this.scheduleConfig.startTime);

    for (const post of unpostedPosts) {
      if (scheduledTime <= new Date(this.scheduleConfig.endTime)) {
        this.posts.set(post.id, {
          ...post,
          scheduledTime
        });
        scheduledTime = new Date(scheduledTime.getTime() + interval * 60000);
      }
    }
  }

  async getPostsByStatus(posted: boolean): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.posted === posted)
      .sort((a, b) => {
        if (posted) {
          // Sort posted tweets by posted time
          return (b.postedAt?.getTime() || 0) - (a.postedAt?.getTime() || 0);
        } else {
          // Sort pending tweets by scheduled time
          return (a.scheduledTime?.getTime() || 0) - (b.scheduledTime?.getTime() || 0);
        }
      });
  }
}

export const storage = new MemStorage();

// Initialize storage with JSON data
const jsonPath = path.join(process.cwd(), "attached_assets/Pasted--name-Wickly-nl-category-Ecommerce-Candle-Webshop-location-Nether-1741446888682.txt");
storage.initializeFromJson(jsonPath)
  .catch(error => {
    log(`Failed to initialize storage: ${error.message}`, 'storage');
    process.exit(1);
  });