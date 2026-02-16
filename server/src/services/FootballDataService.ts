import axios, { AxiosInstance } from "axios";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { cacheService } from "../config/redis";

interface FootballMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: {
    id: number;
    name: string;
    shortName?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName?: string;
  };
  competition: {
    id: number;
    name: string;
    code: string;
  };
  score?: {
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
}

interface ApiResponse {
  matches: FootballMatch[];
}

class FootballDataService {
  private client: AxiosInstance;
  private requestCount: number = 0;
  private resetTime: number = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: config.FOOTBALL_API_BASE_URL,
      headers: {
        "X-Auth-Token": config.FOOTBALL_API_KEY,
      },
      timeout: 10000,
    });
  }

  private checkRateLimit() {
    const now = Date.now();
    const timePassed = (now - this.resetTime) / 1000;

    // Reset counter every minute
    if (timePassed >= 60) {
      this.requestCount = 0;
      this.resetTime = now;
    }

    // Free tier: 10 requests per minute
    if (this.requestCount >= 10) {
      const waitTime = 60 - timePassed;
      logger.warn(`Rate limit approaching. Wait ${waitTime.toFixed(0)}s`, {
        requestCount: this.requestCount,
      });
    }

    this.requestCount++;
  }

  async getMatchesByDate(dateStr: string): Promise<FootballMatch[]> {
    const cacheKey = `football:matches:${dateStr}`;
    
    try {
      // Check cache first
      const cached = await cacheService.getJson<FootballMatch[]>(cacheKey);
      if (cached && cached.length > 0) {
        logger.info("Cache hit for matches", { date: dateStr, count: cached.length });
        return cached;
      }

      this.checkRateLimit();

      logger.info("Fetching matches from Football-Data API", { date: dateStr });

      const response = await this.client.get<ApiResponse>("/matches", {
        params: {
          dateFrom: dateStr,
          dateTo: dateStr,
        },
      });

      const matches = response.data.matches || [];
      logger.info("Matches fetched successfully", { date: dateStr, count: matches.length });

      // Cache for 1 hour
      if (matches.length > 0) {
        await cacheService.setJson(cacheKey, matches, 3600);
      }

      return matches;
    } catch (error) {
      logger.error("Error fetching matches from API", { date: dateStr, error });
      
      // Try to return cached data on error
      const cached = await cacheService.getJson<FootballMatch[]>(cacheKey);
      if (cached) {
        logger.warn("Returning cached data due to API error", { date: dateStr });
        return cached;
      }
      
      return [];
    }
  }

  async getMatchesByCompetition(competitionId: string, limit: number = 10): Promise<FootballMatch[]> {
    const cacheKey = `football:competition:${competitionId}`;
    
    try {
      const cached = await cacheService.getJson<FootballMatch[]>(cacheKey);
      if (cached && cached.length > 0) {
        return cached;
      }

      this.checkRateLimit();

      const response = await this.client.get<ApiResponse>(`/competitions/${competitionId}/matches`, {
        params: {
          limit,
          status: "SCHEDULED,LIVE",
        },
      });

      const matches = response.data.matches || [];
      
      if (matches.length > 0) {
        await cacheService.setJson(cacheKey, matches, 1800); // 30 min
      }

      return matches;
    } catch (error) {
      logger.error("Error fetching competition matches", { competitionId, error });
      return [];
    }
  }

  formatMatch(match: FootballMatch) {
    const [date, time] = match.utcDate.split("T");
    const timeOnly = time.substring(0, 5);

    return {
      apiId: match.id,
      date,
      time: timeOnly,
      homeTeam: match.homeTeam.name || match.homeTeam.shortName || "Home",
      awayTeam: match.awayTeam.name || match.awayTeam.shortName || "Away",
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      league: match.competition.name,
      leagueCode: match.competition.code,
      leagueId: match.competition.id,
      status: match.status,
      score: match.score?.fullTime || null,
    };
  }

  private isOldData(dateStr: string): boolean {
    const matchDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  }
}

export default new FootballDataService();
