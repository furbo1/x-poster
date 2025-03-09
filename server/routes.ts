import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startScheduler } from "./services/scheduler";
import { postTweet, verifyTwitterCredentials } from "./services/twitter";
import { log } from "./vite";
import { insertScheduleConfigSchema } from "@shared/schema";
import path from "path";
import fs from "fs/promises";

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

  // Skip a post
  app.post("/api/posts/:id/skip", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAsSkipped(id);

      // After skipping, update the schedule times for remaining posts
      const config = await storage.getActiveScheduleConfig();
      if (config) {
        await storage.updatePostScheduledTimes(config.interval);
      }

      res.json({ message: "Post skipped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload new JSON file
  app.post("/api/posts/upload", async (req, res) => {
    try {
      const fileContent = req.body;
      if (!Array.isArray(fileContent)) {
        return res.status(400).json({ message: "Invalid JSON format. Expected an array of listings." });
      }

      // Validate the format of each listing
      const requiredFields = ['name', 'category', 'location', 'revenue', 'monthly_profit', 'profit_margin', 'promo_text'];
      const missingFields = fileContent.some(listing => 
        !requiredFields.every(field => listing.hasOwnProperty(field))
      );

      if (missingFields) {
        return res.status(400).json({ 
          message: "Invalid listing format. Each listing must include: " + requiredFields.join(", ")
        });
      }

      // Save the file
      const timestamp = new Date().getTime();
      const fileName = `listings-${timestamp}.json`;
      const filePath = path.join(process.cwd(), "attached_assets", fileName);

      await fs.writeFile(filePath, JSON.stringify(fileContent, null, 2));
      await storage.initializeFromJson(filePath);

      // Update schedule if exists
      const config = await storage.getActiveScheduleConfig();
      if (config) {
        await storage.updatePostScheduledTimes(config.interval);
      }

      res.json({ message: "Posts uploaded and initialized successfully" });
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
      const authStatus = await verifyTwitterCredentials();
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

  // Cancel all pending posts
  app.post("/api/posts/cancel-all", async (_req, res) => {
    try {
      await storage.markAllAsSkipped();
      res.json({ message: "All pending posts cancelled successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Initialize scheduler
  startScheduler();

  const httpServer = createServer(app);
  return httpServer;
}