import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startScheduler } from "./services/scheduler";
import { postTweet, verifyTwitterCredentials } from "./services/twitter";
import { log } from "./vite";
import { insertScheduleConfigSchema } from "@shared/schema";

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

  // Get current schedule configuration
  app.get("/api/schedule", async (_req, res) => {
    try {
      const config = await storage.getActiveScheduleConfig();
      res.json(config || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update schedule configuration
  app.post("/api/schedule", async (req, res) => {
    try {
      const data = insertScheduleConfigSchema.parse(req.body);

      // Validate time range
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      if (start >= end) {
        return res.status(400).json({
          message: "End time must be after start time"
        });
      }

      if (start < new Date()) {
        return res.status(400).json({
          message: "Start time must be in the future"
        });
      }

      const config = await storage.saveScheduleConfig(data);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({
        message: error.message
      });
    }
  });

  // Diagnostic endpoint for testing Twitter auth
  app.get("/api/twitter/test-auth", async (_req, res) => {
    try {
      const authStatus = await testAuth();
      res.json(authStatus);
    } catch (error: any) {
      res.status(500).json({
        message: "Authentication test failed",
        error: error.message,
        details: error.data
      });
    }
  });

  // Test endpoint to trigger a post immediately
  app.post("/api/posts/test", async (_req, res) => {
    try {
      // First verify credentials
      const isVerified = await verifyTwitterCredentials();
      if (!isVerified) {
        return res.status(401).json({ 
          message: "Twitter credentials verification failed",
          status: "error"
        });
      }

      const post = await storage.getNextUnpostedItem();
      if (!post) {
        return res.status(404).json({ message: "No unposted items found" });
      }

      log(`Test posting tweet for listing: ${post.name}`, "twitter");

      // Clear any previous errors before attempting new post
      await storage.clearErrors();

      try {
        await postTweet(post.promoText);
        await storage.markAsPosted(post.id);
        res.json({ 
          message: "Tweet posted successfully", 
          post,
          status: "success" 
        });
      } catch (twitterError: any) {
        const errorMessage = twitterError.message || "Unknown error occurred";
        log(`Error posting tweet: ${errorMessage}`, "twitter");

        if (twitterError.data) {
          log(`Error details: ${JSON.stringify(twitterError.data)}`, "twitter");
        }

        // Mark only this specific post as failed
        await storage.markAsFailed(post.id, errorMessage);

        res.status(500).json({ 
          message: errorMessage,
          details: twitterError.data,
          status: "error"
        });
      }
    } catch (error: any) {
      log(`Error in test post: ${error.message}`, "twitter");
      res.status(500).json({ 
        message: error.message,
        status: "error" 
      });
    }
  });

  // Initialize scheduler
  startScheduler();

  const httpServer = createServer(app);
  return httpServer;
}