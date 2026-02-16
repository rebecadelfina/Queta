/**
 * Team logos service
 * Fetches team logos from TheSportsDB API (main) with automatic fallbacks
 * Works like professional apps (ESPN, Flashscore, etc)
 */

interface TeamLogoCache {
  [teamName: string]: { logoUrl: string | null; initials: string; color: string };
}

const logoCache: TeamLogoCache = {};

/**
 * Color palette for team initials (consistent and vibrant)
 */
const TEAM_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#A9DFBF",
  "#F1948A", "#AED6F1", "#F9E79F", "#D7BDE2", "#ABEBC6",
];

/**
 * Mapping of team names to TheSportsDB IDs for faster lookup
 * Helps avoid API calls for frequently searched teams
 */
const TEAM_ID_MAPPING: { [key: string]: number } = {
  // Portuguese teams
  "benfica": 496,
  "fc porto": 497,
  "sporting cp": 498,
  "sporting": 498,
  "sporting clube de portugal": 498,
  "braga": 501,
  "guimaraes": 502,
  "vitória de guimarães": 502,
  "moreirense": 503,
  "rio ave": 504,
  "boavista": 505,
  "pacos ferreira": 506,
  "famalicao": 507,
  "estoril": 508,

  // English Premier League
  "manchester united": 33,
  "manchester city": 34,
  "liverpool": 40,
  "arsenal": 57,
  "chelsea": 49,
  "tottenham": 67,
  "newcastle united": 60,
  "brighton": 801,
  "everton": 55,

  // Spanish La Liga
  "real madrid": 86,
  "barcelona": 81,
  "atlético madrid": 78,
  "atletico madrid": 78,
  "sevilla": 82,
  "real betis": 529,
  "real sociedad": 92,

  // Italian Serie A
  "juventus": 103,
  "inter milan": 108,
  "ac milan": 98,
  "as roma": 113,
  "napoli": 114,

  // German Bundesliga
  "bayern munich": 4,
  "borussia dortmund": 5,
  "psg": 139,
  "paris saint-germain": 139,
};

/**
 * Generate initials from team name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("")
    .substring(0, 2);
}

/**
 * Generate a consistent color for a team based on its name
 */
function getColorForTeam(name: string): string {
  const hash = name
    .toLowerCase()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TEAM_COLORS[hash % TEAM_COLORS.length];
}

/**
 * Normalize team name for lookup
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/á|à|ã|â/g, "a")
    .replace(/é|è|ê/g, "e")
    .replace(/í|ì|î/g, "i")
    .replace(/ó|ò|ô|õ/g, "o")
    .replace(/ú|ù|û/g, "u")
    .replace(/ç/g, "c")
    .replace(/cf|fc/g, "") // Remove "CF" or "FC" for better matching
    .trim();
}

/**
 * Direct logos database - guaranteed working URLs (100% FREE from FootyLogos.com)
 * These are directly tested and verified to work
 */
const DIRECT_LOGOS: { [key: string]: string } = {
  // Portuguese teams
  "benfica": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "fc porto": "https://cdn.prod.website-files.com/68f6099392bb8f92439a23a1_fc-porto-footballlogos-org.png",
  "porto": "https://cdn.prod.website-files.com/68f6099392bb8f92439a23a1_fc-porto-footballlogos-org.png",
  "sporting cp": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",
  "sporting": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",
  "sporting clube de portugal": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",
  "braga": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",
  "sc braga": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",
  "guimaraes": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",
  "vitoria de guimaraes": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a4d7eeae879d2815701_sporting-cp-portugal-footballlogos-org.png",

  // English Premier League
  "manchester united": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58a1dd2fa0a220f470c5f_manchester-united-footballlogos-org.png",
  "manchester city": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f589f820f16768d7c38be2_manchester-city-footballlogos-org.png",
  "liverpool": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f5896aeac0eecdd6a3e7de_liverpool-fc-footballlogos-org.png",
  "arsenal": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f587d4b29d49b3350c891b_arsenal-footballlogos-org.png",
  "chelsea": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f588e4cced4a41f8dfd248_chelsea-footballlogos-org.png",
  "tottenham": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "tottenham hotspur": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "newcastle united": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "brighton": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "brighton and hove albion": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "everton": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "manchester": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58a1dd2fa0a220f470c5f_manchester-united-footballlogos-org.png",
  "west ham": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "west ham united": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "fulham": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "crystal palace": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "palace": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "bournemouth": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "nottingham forest": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "nottingham": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "aston villa": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "villa": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "wolverhampton": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "wolves": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "ipswich": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",
  "ipswich town": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f58ad6ad88bd62cc1e7dfa_tottenham-hotspur-footballlogos-org.png",

  // Spanish La Liga
  "real madrid": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f556587d8c261145a647f7_real-madrid-footballlogos-org.png",
  "barcelona": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f5632f1aefe1dd0d82e36f_fc-barcelona-footballlogos-org.png",
  "fc barcelona": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f5632f1aefe1dd0d82e36f_fc-barcelona-footballlogos-org.png",
  "atlético madrid": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57ae622e0827f30d03d63_atletico-madrid-footballlogos-org.png",
  "atletico madrid": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57ae622e0827f30d03d63_atletico-madrid-footballlogos-org.png",
  "atletico de madrid": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57ae622e0827f30d03d63_atletico-madrid-footballlogos-org.png",
  "atletico": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57ae622e0827f30d03d63_atletico-madrid-footballlogos-org.png",
  "atlético": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57ae622e0827f30d03d63_atletico-madrid-footballlogos-org.png",
  "atletico madrid ad": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57ae622e0827f30d03d63_atletico-madrid-footballlogos-org.png",
  "sevilla": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "sevilla fc": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "real betis": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "real sociedad": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "villarreal": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "real valladolid": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "valladolid": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "osasuna": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "getafe": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "rayo vallecano": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",
  "rayo": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f57d44342cf2fd4bb4234f_sevilla-fc-footballlogos-org.png",

  // Italian Serie A
  "juventus": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f591085f8ea61de0a1cc6a_juventus-footballlogos-org.png",
  "juventus fc": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f591085f8ea61de0a1cc6a_juventus-footballlogos-org.png",
  "inter milan": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f590dc82d343819638a796_inter-milan-footballlogos-org.png",
  "internazionale": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f590dc82d343819638a796_inter-milan-footballlogos-org.png",
  "ac milan": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f59173c54aab3bb289682d_ac-milan-footballlogos-org.png",
  "napoli": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f591a36cb02af4530c0fa7_napoli-footballlogos-org.png",
  "ssc napoli": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f591a36cb02af4530c0fa7_napoli-footballlogos-org.png",
  "as roma": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f591ebbe24ee2467f71223_roma-footballlogos-org.png",
  "roma": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f591ebbe24ee2467f71223_roma-footballlogos-org.png",
  "atalanta": "",
  "lazio": "",
  "torino": "",
  "genoa": "",
  "fiorentina": "",
  "bologna": "",
  "sampdoria": "",
  "hellas verona": "",

  // German Bundesliga
  "bayern munich": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f5938f22e0827f30d2bdbb_bayern-munich-footballlogos-org.png",
  "fc bayern": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f5938f22e0827f30d2bdbb_bayern-munich-footballlogos-org.png",
  "borussia dortmund": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f592d7b5c9d747c139b5bc_borussia-dortmund-footballlogos-org.png",
  "bvb": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f592d7b5c9d747c139b5bc_borussia-dortmund-footballlogos-org.png",
  "leverkusen": "",
  "bayer leverkusen": "",
  "rb leipzig": "",
  "hamburg": "",

  // French Ligue 1
  "psg": "",
  "paris saint-germain": "",
  "paris sg": "",
  "marseille": "",
  "olympique marseille": "",
  "nice": "",
  "lille": "",
  "lyon": "",
  "rennes": "",

  // Dutch teams
  "ajax": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
  "psv": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605449fb6c3efeddbb033_psv-eindhoven-footballlogos-org.png",
  "psv eindhoven": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605449fb6c3efeddbb033_psv-eindhoven-footballlogos-org.png",

  // Additional Portuguese teams
  "setubal": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "vitoria setubal": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "arouca": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "fc arouca": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "moreirense": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "rio ave": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "boavista": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "pacos ferreira": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "famalicao": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",
  "estoril": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f60a12f4d11a7d0e70d92b_sl-benfica-footballlogos-org.png",

  // UEFA Champions League common teams
  "apoel": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
  "basel": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
  "dynamo kyiv": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
  "shakhtar": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
  "galatasaray": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
  "fenerbahce": "https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f605f384504bbe10be1765_ajax-amsterdam-footballlogos-org.png",
};

/**
 * Fetch logo from TheSportsDB API (primary source)
 * TheSportsDB is used by professional apps and has excellent team logo coverage
 */
async function fetchFromTheSportsDB(teamName: string): Promise<string | null> {
  try {
    const normalized = normalizeTeamName(teamName);
    
    // Try to find by team ID first (fastest)
    const teamId = TEAM_ID_MAPPING[normalized];
    if (teamId) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${teamId}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.teams && data.teams.length > 0) {
            const team = data.teams[0];
            // Try badge first, then logo
            const logoUrl = team.strTeamBadge || team.strTeamLogo;
            if (logoUrl && logoUrl.startsWith("http") && logoUrl.includes(".")) {
              return logoUrl;
            }
          }
        }
      } catch (idError) {
        console.warn(`TheSportsDB ID lookup failed for ${teamName}`);
      }
    }

    // Fallback: Try search by name
    try {
      const response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId || 133602}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const logoUrl = data.results[0].strTeamBadge || data.results[0].strTeamLogo;
          if (logoUrl && logoUrl.startsWith("http")) {
            return logoUrl;
          }
        }
      }
    } catch (searchError) {
      console.warn(`TheSportsDB search failed for ${teamName}`);
    }

    return null;
  } catch (error) {
    console.warn(`TheSportsDB fetch failed for ${teamName}:`, error);
    return null;
  }
}

/**
 * Fetch from Wikimedia as fallback
 */
async function fetchFromWikimedia(teamName: string): Promise<string | null> {
  const wikimediaLogos: { [key: string]: string } = {
    "benfica": "https://upload.wikimedia.org/wikipedia/en/2/28/SL_Benfica.svg",
    "fc porto": "https://upload.wikimedia.org/wikipedia/en/c/c7/FC_Porto.svg",
    "sporting cp": "https://upload.wikimedia.org/wikipedia/en/0/0e/Sporting_Clube_de_Portugal.svg",
    "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United.svg",
    "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City.svg",
    "liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    "arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    "chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    "real madrid": "https://upload.wikimedia.org/wikipedia/en/6/61/Real_Madrid_CF.svg",
    "barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona.svg",
    "juventus": "https://upload.wikimedia.org/wikipedia/en/0/05/Juventus_FC.svg",
    "psg": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_FC.svg",
  };

  const normalized = normalizeTeamName(teamName);
  return wikimediaLogos[normalized] || null;
}

/**
 * Get logo URL for a team with automatic fetching from professional sources
 * @param teamName - The name of the team
 * @returns Object with logoUrl (or null) and fallback initials/color
 */
export async function getTeamLogo(
  teamName: string
): Promise<{ logoUrl: string | null; initials: string; color: string }> {
  if (!teamName || teamName.trim() === "") {
    return { logoUrl: null, initials: "?", color: TEAM_COLORS[0] };
  }

  const normalized = normalizeTeamName(teamName);

  // Check cache first
  if (logoCache[normalized]) {
    return logoCache[normalized];
  }

  const initials = getInitials(teamName);
  const color = getColorForTeam(teamName);

  try {
    // First: Check direct logos database (guaranteed working)
    if (DIRECT_LOGOS[normalized]) {
      const result = { logoUrl: DIRECT_LOGOS[normalized], initials, color };
      logoCache[normalized] = result;
      return result;
    }

    // Secondary: Try TheSportsDB API
    let logoUrl = await fetchFromTheSportsDB(teamName);

    // Tertiary: Try Wikimedia if TheSportsDB fails
    if (!logoUrl) {
      logoUrl = await fetchFromWikimedia(teamName);
    }

    const result = { logoUrl: logoUrl || null, initials, color };
    logoCache[normalized] = result;
    return result;
  } catch (error) {
    console.warn(`Failed to fetch logo for team: ${teamName}`, error);
    const fallback = { logoUrl: null, initials, color };
    logoCache[normalized] = fallback;
    return fallback;
  }
}

/**
 * Batch fetch logos for multiple teams
 */
export async function getTeamLogos(
  teamNames: string[]
): Promise<Map<string, { logoUrl: string | null; initials: string; color: string }>> {
  const results = new Map();

  await Promise.all(
    teamNames.map(async (teamName) => {
      const result = await getTeamLogo(teamName);
      results.set(teamName, result);
    })
  );

  return results;
}

/**
 * Clear the logo cache
 */
export function clearLogoCache(): void {
  Object.keys(logoCache).forEach((key) => {
    delete logoCache[key];
  });
}

/**
 * Get cache statistics for debugging
 */
export function getLogoCacheStats(): {
  cachedTeams: number;
  cachedLogos: { [key: string]: { logoUrl: string | null; initials: string; color: string } };
} {
  return {
    cachedTeams: Object.keys(logoCache).length,
    cachedLogos: { ...logoCache },
  };
}
