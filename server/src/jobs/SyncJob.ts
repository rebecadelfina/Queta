import cron from "node-cron";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import matchService from "../services/MatchService";

export class SyncMatchesJob {
  private task: cron.ScheduledTask | null = null;

  start() {
    logger.info("Starting SyncMatchesJob", { schedule: config.SYNC_SCHEDULE });

    this.task = cron.schedule(config.SYNC_SCHEDULE, async () => {
      try {
        logger.info("Running scheduled sync job");

        // Sync today's matches
        const today = new Date().toISOString().split("T")[0];
        const todayCount = await matchService.syncMatchesForDate(today);

        // Sync tomorrow's matches
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        const tomorrowCount = await matchService.syncMatchesForDate(tomorrowStr);

        // Sync next 7 days for better planning
        for (let i = 2; i <= 7; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);
          const futureDateStr = futureDate.toISOString().split("T")[0];
          await matchService.syncMatchesForDate(futureDateStr);
        }

        logger.info("Scheduled sync job completed", {
          today: todayCount,
          tomorrow: tomorrowCount,
        });
      } catch (error) {
        logger.error("Scheduled sync job error", error);
      }
    });

    // Run immediately on startup
    this.runSync();
  }

  private async runSync() {
    try {
      logger.info("Running initial sync on startup");
      const today = new Date().toISOString().split("T")[0];
      await matchService.syncMatchesForDate(today);
    } catch (error) {
      logger.error("Initial sync error", error);
    }
  }

  stop() {
    if (this.task) {
      this.task.stop();
      logger.info("SyncMatchesJob stopped");
    }
  }
}

export class CleanupJob {
  private task: cron.ScheduledTask | null = null;

  start() {
    logger.info("Starting CleanupJob", { schedule: config.CLEANUP_SCHEDULE });

    this.task = cron.schedule(config.CLEANUP_SCHEDULE, async () => {
      try {
        logger.info("Running scheduled cleanup job");
        const deleted = await matchService.cleanupOldMatches(30);
        logger.info("Cleanup job completed", { deletedMatches: deleted });
      } catch (error) {
        logger.error("Cleanup job error", error);
      }
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      logger.info("CleanupJob stopped");
    }
  }
}
