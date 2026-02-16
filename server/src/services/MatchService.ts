import { db } from "../config/database";
import { logger } from "../utils/logger";
import { cacheService } from "../config/redis";
import footballDataService from "./FootballDataService";

export interface Match {
  id: string;
  apiId: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  league: string;
  leagueCode: string;
  leagueId: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  createdAt: string;
  updatedAt: string;
}

class MatchService {
  async getMatchesByDate(dateStr: string, forceRefresh: boolean = false): Promise<Match[]> {
    const cacheKey = `matches:${dateStr}`;
    
    // Try cache first
    if (!forceRefresh) {
      const cached = await cacheService.getJson<Match[]>(cacheKey);
      if (cached) {
        logger.info("Cache hit for matches by date", { date: dateStr });
        return cached;
      }
    }

    try {
      const matches = await db.getAll<Match>(
        `SELECT * FROM matches WHERE date = $1 ORDER BY time ASC`,
        [dateStr]
      );
      
      if (matches.length > 0) {
        await cacheService.setJson(cacheKey, matches, 1800); // 30 min cache
      }
      
      return matches;
    } catch (error) {
      logger.error("Error fetching matches by date", { date: dateStr, error });
      return [];
    }
  }

  async getMatchById(id: string): Promise<Match | null> {
    try {
      return await db.getOne<Match>(
        `SELECT * FROM matches WHERE id = $1`,
        [id]
      );
    } catch (error) {
      logger.error("Error fetching match by id", { id, error });
      return null;
    }
  }

  async getMatchesByLeague(leagueCode: string, days: number = 7): Promise<Match[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + days);

    try {
      return await db.getAll<Match>(
        `SELECT * FROM matches 
         WHERE leagueCode = $1 
         AND date >= $2 
         AND date <= $3 
         ORDER BY date ASC, time ASC`,
        [leagueCode, fromDate.toISOString().split("T")[0], toDate.toISOString().split("T")[0]]
      );
    } catch (error) {
      logger.error("Error fetching matches by league", { leagueCode, error });
      return [];
    }
  }

  async syncMatchesForDate(dateStr: string): Promise<number> {
    try {
      logger.info("Starting sync for date", { date: dateStr });

      const apiMatches = await footballDataService.getMatchesByDate(dateStr);
      
      if (apiMatches.length === 0) {
        logger.info("No matches found for date", { date: dateStr });
        return 0;
      }

      let insertedCount = 0;

      for (const apiMatch of apiMatches) {
        const formatted = footballDataService.formatMatch(apiMatch);
        
        try {
          // Check if match exists
          const existing = await db.getOne<Match>(
            `SELECT id FROM matches WHERE apiId = $1`,
            [formatted.apiId]
          );

          if (existing) {
            // Update existing
            await db.run(
              `UPDATE matches 
               SET status = $1, homeScore = $2, awayScore = $3, updatedAt = CURRENT_TIMESTAMP
               WHERE apiId = $4`,
              [formatted.status, formatted.score?.home, formatted.score?.away, formatted.apiId]
            );
          } else {
            // Insert new
            await db.run(
              `INSERT INTO matches 
               (apiId, date, time, homeTeam, awayTeam, homeTeamId, awayTeamId, 
                league, leagueCode, leagueId, status, createdAt, updatedAt)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [
                formatted.apiId,
                formatted.date,
                formatted.time,
                formatted.homeTeam,
                formatted.awayTeam,
                formatted.homeTeamId,
                formatted.awayTeamId,
                formatted.league,
                formatted.leagueCode,
                formatted.leagueId,
                formatted.status,
              ]
            );
            insertedCount++;
          }
        } catch (error) {
          logger.error("Error syncing individual match", { match: formatted, error });
        }
      }

      // Clear cache for this date
      await cacheService.del(`matches:${dateStr}`);

      logger.info("Sync completed", { date: dateStr, inserted: insertedCount, total: apiMatches.length });
      return insertedCount;
    } catch (error) {
      logger.error("Error syncing matches for date", { date: dateStr, error });
      return 0;
    }
  }

  async cleanupOldMatches(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const dateStr = cutoffDate.toISOString().split("T")[0];

      const result = await db.run(
        `DELETE FROM matches WHERE date < $1 AND status = 'FINISHED'`,
        [dateStr]
      );

      const deletedCount = result.rowCount || 0;
      logger.info("Cleanup completed", { days, deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error("Error cleaning up old matches", { days, error });
      return 0;
    }
  }

  async getUpcomingMatches(limit: number = 50): Promise<Match[]> {
    try {
      return await db.getAll<Match>(
        `SELECT * FROM matches 
         WHERE status IN ('SCHEDULED', 'LIVE')
         AND date >= CURRENT_DATE
         ORDER BY date ASC, time ASC
         LIMIT $1`,
        [limit]
      );
    } catch (error) {
      logger.error("Error fetching upcoming matches", { error });
      return [];
    }
  }

  async getStatistics(): Promise<{
    totalMatches: number;
    scheduledMatches: number;
    liveMatches: number;
    finishedMatches: number;
    uniqueLeagues: number;
  }> {
    try {
      const stats = await db.getOne<any>(
        `SELECT 
          COUNT(*) as totalMatches,
          SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) as scheduledMatches,
          SUM(CASE WHEN status = 'LIVE' THEN 1 ELSE 0 END) as liveMatches,
          SUM(CASE WHEN status = 'FINISHED' THEN 1 ELSE 0 END) as finishedMatches,
          COUNT(DISTINCT leagueCode) as uniqueLeagues
         FROM matches`
      );

      return {
        totalMatches: parseInt(stats?.totalMatches || 0),
        scheduledMatches: parseInt(stats?.scheduledMatches || 0),
        liveMatches: parseInt(stats?.liveMatches || 0),
        finishedMatches: parseInt(stats?.finishedMatches || 0),
        uniqueLeagues: parseInt(stats?.uniqueLeagues || 0),
      };
    } catch (error) {
      logger.error("Error fetching statistics", error);
      return {
        totalMatches: 0,
        scheduledMatches: 0,
        liveMatches: 0,
        finishedMatches: 0,
        uniqueLeagues: 0,
      };
    }
  }
}

export default new MatchService();
