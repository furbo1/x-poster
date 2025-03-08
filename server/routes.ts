import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startScheduler } from "./services/scheduler";
import { postTweet } from "./services/twitter";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all posts
  app.get("/api/posts", async (_req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Test endpoint to trigger a post immediately
  app.post("/api/posts/test", async (_req, res) => {
    try {
      const post = await storage.getNextUnpostedItem();
      if (!post) {
        return res.status(404).json({ message: "No unposted items found" });
      }

      log(`Test posting tweet for listing: ${post.name}`, "twitter");
      await postTweet(post.promoText);
      await storage.markAsPosted(post.id);

      res.json({ message: "Tweet posted successfully", post });
    } catch (error: any) {
      log(`Error in test post: ${error.message}`, "twitter");
      res.status(500).json({ message: error.message });
    }
  });

  // Initialize scheduler
  startScheduler();

  const httpServer = createServer(app);
  return httpServer;
}