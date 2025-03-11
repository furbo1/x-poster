import schedule from "node-schedule";
import { storage } from "../storage";
import { postTweet } from "./twitter";
import { log } from "../vite";

// Active hours configuration
export const ACTIVE_HOURS = {
  start: 8, // 8 AM
  end: 23, // 11 PM
  endMinutes: 55 // 55 minutes
};

export function isWithinActiveHours(date: Date): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (hours < ACTIVE_HOURS.start) return false;
  if (hours > ACTIVE_HOURS.end) return false;
  if (hours === ACTIVE_HOURS.end && minutes > ACTIVE_HOURS.endMinutes) return false;
  
  return true;
}

function getNextActiveTime(date: Date): Date {
  const next = new Date(date);
  
  if (next.getHours() < ACTIVE_HOURS.start) {
    next.setHours(ACTIVE_HOURS.start, 0, 0, 0);
  } else if (next.getHours() >= ACTIVE_HOURS.end && next.getMinutes() > ACTIVE_HOURS.endMinutes) {
    next.setDate(next.getDate() + 1);
    next.setHours(ACTIVE_HOURS.start, 0, 0, 0);
  }
  
  return next;
}

let currentJob: schedule.Job | null = null;
let currentPattern: string = "*/5 * * * *";

export function startScheduler() {
  log("Starting Twitter posting scheduler", "scheduler");

  // First stop any existing job
  if (currentJob) {
    currentJob.cancel();
    currentJob = null;
  }

  async function setupSchedulerInterval() {
    const config = await storage.getActiveScheduleConfig();
    if (!config) {
      log("No active schedule configuration found, checking every 5 minutes", "scheduler");
      return "*/5 * * * *"; // Default to 5 minutes if no config
    }

    // Use half the posting interval as the check interval (minimum 5 minutes)
    const checkInterval = Math.max(5, Math.floor(config.interval / 2));
    log(`Setting scheduler check interval to ${checkInterval} minutes based on posting interval of ${config.interval} minutes`, "scheduler");
    return `*/${checkInterval} * * * *`;
  }

  async function runScheduler() {
    try {
      // Get active schedule config
      const config = await storage.getActiveScheduleConfig();
      if (!config) {
        log("No active schedule configuration found", "scheduler");
        return;
      }

      const now = new Date();
      const startTime = new Date(config.startTime);
      const endTime = new Date(config.endTime);

      // Check if we're within the overall schedule window
      if (now < startTime || now > endTime) {
        log("Current time is outside scheduled posting window", "scheduler");
        return;
      }

      // Check if we're within active hours
      if (!isWithinActiveHours(now)) {
        log("Current time is outside active hours (8am-23:55pm)", "scheduler");
        return;
      }

      // Get next unposted item
      const post = await storage.getNextUnpostedItem();
      if (!post) {
        log("No unposted items found", "scheduler");
        return;
      }

      // Check if it's time to post
      if (!post.scheduledTime || now < new Date(post.scheduledTime)) {
        log(`Next post scheduled for: ${post.scheduledTime}`, "scheduler");
        return;
      }

      log(`Attempting to post tweet for listing: ${post.name}`, "scheduler");

      try {
        // Post to Twitter
        await postTweet(post.promoText);
        // Update post status
        await storage.markAsPosted(post.id);
        log(`Successfully posted tweet for ${post.name}`, "scheduler");
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error occurred";
        log(`Scheduler error: ${errorMessage}`, "scheduler");

        // If it's a rate limit error, don't mark as failed immediately
        if (!errorMessage.includes("Rate limit")) {
          await storage.markAsFailed(post.id, errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred";
      log(`Scheduler error: ${errorMessage}`, "scheduler");
    }
  }

  // Initial setup
  setupSchedulerInterval().then(cronPattern => {
    currentPattern = cronPattern;
    currentJob = schedule.scheduleJob(cronPattern, runScheduler);
    log(`Scheduler started with pattern: ${cronPattern}`, "scheduler");
  });

  // Watch for config changes and update interval
  setInterval(async () => {
    if (!currentJob) return;
    
    const newPattern = await setupSchedulerInterval();
    if (newPattern !== currentPattern) {
      currentPattern = newPattern;
      currentJob.cancel();
      currentJob = schedule.scheduleJob(newPattern, runScheduler);
      log(`Scheduler interval updated to: ${newPattern}`, "scheduler");
    }
  }, 5 * 60 * 1000); // Check for config changes every 5 minutes
}