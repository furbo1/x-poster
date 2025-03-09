import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startScheduler } from "./services/scheduler";
import { postTweet, verifyTwitterCredentials } from "./services/twitter";
import { log } from "./vite";
import { insertScheduleConfigSchema } from "@shared/schema";
import path from "path";
import fs from "fs/promises";
import { setupAuth, requireAuth } from "./auth";
import { resetPasswordSchema, newPasswordSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy" });
  });

  // Set up authentication
  setupAuth(app);

  // Protected routes - require authentication
  app.get("/api/posts", requireAuth, async (_req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/posts/:id/skip", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAsSkipped(id);

      const config = await storage.getActiveScheduleConfig();
      if (config) {
        await storage.updatePostScheduledTimes(config.interval);
      }

      res.json({ message: "Post skipped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/posts/upload", requireAuth, async (req, res) => {
    try {
      const fileContent = req.body;
      if (!Array.isArray(fileContent)) {
        return res.status(400).json({ message: "Invalid JSON format. Expected an array of listings." });
      }

      const requiredFields = ['name', 'category', 'location', 'revenue', 'monthly_profit', 'profit_margin', 'promo_text'];
      const missingFields = fileContent.some(listing => 
        !requiredFields.every(field => listing.hasOwnProperty(field))
      );

      if (missingFields) {
        return res.status(400).json({ 
          message: "Invalid listing format. Each listing must include: " + requiredFields.join(", ")
        });
      }

      const timestamp = new Date().getTime();
      const fileName = `listings-${timestamp}.json`;
      const filePath = path.join(process.cwd(), "attached_assets", fileName);

      await fs.writeFile(filePath, JSON.stringify(fileContent, null, 2));
      await storage.initializeFromJson(filePath);

      const config = await storage.getActiveScheduleConfig();
      if (config) {
        await storage.updatePostScheduledTimes(config.interval);
      }

      res.json({ message: "Posts uploaded and initialized successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/schedule", requireAuth, async (_req, res) => {
    try {
      const config = await storage.getActiveScheduleConfig();
      res.json(config || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/schedule", requireAuth, async (req, res) => {
    try {
      const data = insertScheduleConfigSchema.parse(req.body);

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

  app.post("/api/posts/cancel-all", requireAuth, async (_req, res) => {
    try {
      await storage.markAllAsSkipped();
      res.json({ message: "All pending posts cancelled successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/twitter/test-auth", requireAuth, async (_req, res) => {
    try {
      const authStatus = await verifyTwitterCredentials();
      res.json(authStatus);
    } catch (error: any) {
      res.status(500).json({
        message: "Twitter authentication test failed",
        error: error.message,
        details: error.data
      });
    }
  });

  app.post("/api/posts/test", requireAuth, async (_req, res) => {
    try {
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

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email } = resetPasswordSchema.parse(req.body);

      // Only allow reset for the specified email
      if (email !== "al_razvan@yahoo.com") {
        return res.status(400).json({ message: "Invalid email address" });
      }

      const token = randomBytes(32).toString("hex");
      await storage.setResetToken(email, token);

      // Here you would typically send an email with the reset link
      // For now, we'll just return the token in the response
      res.json({ 
        message: "Password reset instructions have been sent to your email",
        token // In production, remove this and send via email
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = newPasswordSchema.parse(req.body);

      const user = await storage.verifyResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updatePassword(user.id, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Initialize scheduler
  startScheduler();

  const httpServer = createServer(app);
  return httpServer;
}