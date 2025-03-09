import schedule from "node-schedule";
import { storage } from "../storage";
import { postTweet } from "./twitter";
import { log } from "../vite";

export function startScheduler() {
  log("Starting Twitter posting scheduler", "scheduler");

  // Schedule job to run every minute to check for posts
  const job = schedule.scheduleJob("* * * * *", async () => {
    try {
      // Get active schedule config
      const config = await storage.getActiveScheduleConfig();
      if (!config) {
        log("No active schedule configuration found", "scheduler");
        return;
      }

      const now = new Date();
      if (now < config.startTime || now > config.endTime) {
        log("Current time is outside scheduled posting window", "scheduler");
        return;
      }

      // Get next unposted item
      const post = await storage.getNextUnpostedItem();
      if (!post) {
        log("No unposted items found", "scheduler");
        return;
      }

      // Check if it's time to post
      if (!post.scheduledTime || now < post.scheduledTime) {
        log(`Next post scheduled for: ${post.scheduledTime}`, "scheduler");
        return;
      }

      log(`Attempting to post tweet for listing: ${post.name}`, "scheduler");

      // Post to Twitter
      await postTweet(post.promoText);

      // Update post status
      await storage.markAsPosted(post.id);

      log(`Successfully posted tweet for ${post.name}`, "scheduler");
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred";
      log(`Scheduler error: ${errorMessage}`, "scheduler");

      if (error.post) {
        await storage.markAsFailed(error.post.id, errorMessage);
      }
    }
  });

  log(`Scheduler started, next check in 1 minute`, "scheduler");
}