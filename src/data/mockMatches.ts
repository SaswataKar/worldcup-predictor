export const mockMatches = [
  {
    id: 999001,

    homeTeam: {
      name: "Brazil",

      crest:
        "https://crests.football-data.org/764.svg",
    },

    awayTeam: {
      name: "Argentina",

      crest:
        "https://crests.football-data.org/762.svg",
    },

    utcDate: new Date(
      Date.now() + 5 * 60 * 1000
    ).toISOString(),

    stage: "TEST MATCH",

    status: "SCHEDULED",

    score: {
      fullTime: {
        home: null,
        away: null,
      },
    },
  },

  {
    id: 999002,

    homeTeam: {
      name: "France",

      crest:
        "https://crests.football-data.org/773.svg",
    },

    awayTeam: {
      name: "Germany",

      crest:
        "https://crests.football-data.org/759.svg",
    },

    utcDate: new Date(
      Date.now() +
        24 * 60 * 60 * 1000
    ).toISOString(),

    stage: "TOMORROW TEST",

    status: "SCHEDULED",

    score: {
      fullTime: {
        home: null,
        away: null,
      },
    },
  },

  {
    id: 999003,

    homeTeam: {
      name: "Spain",

      crest:
        "https://crests.football-data.org/760.svg",
    },

    awayTeam: {
      name: "Portugal",

      crest:
        "https://crests.football-data.org/765.svg",
    },

    utcDate: new Date(
      Date.now() -
        60 * 60 * 1000
    ).toISOString(),

    stage: "LOCKED TEST",

    status: "FINISHED",

    score: {
      fullTime: {
        home: 2,
        away: 1,
      },
    },
  },
];