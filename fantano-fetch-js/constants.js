const NEW_REVIEW_TYPES = ["ALBUM", "MIXTAPE", "EP"];
const OLD_REVIEW_TYPES = ["Album", "Review"];

// Regex to match reviews that came before "Flying Lotus- Cosmogramma ALBUM REVIEW".
const PRE_COSMOGRAMMA_REVIEW_REGEX = /.+\- [^\"]+ Review.*/;
const FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE = new Date("2010-05-05T18:34:43Z");

// REGEX to match a rating within a video description.
const RATING_REGEX = /([0-9]|10)\/10(?!,)/;

// (?:(.*)(?:-\s+|: )(.+?(?= EP| ALBUM| MIXTAPE)))|(?:(.*)- (.+?(?= Album| Review)))
const ARTIST_TITLE_REGEX = new RegExp(
  `(?:(.+)- (.+?(?= ${NEW_REVIEW_TYPES.join(
    "| "
  )})))|(?:(.+)(?:-s+|: )(.+?(?= EP| ALBUM| MIXTAPE)))|(?:(.+)- (.+?(?= ${OLD_REVIEW_TYPES.join(
    "| "
  )})))`
);

const GENRE_REGEX = /(:?\/ ([^\/]+))$/;
const GENRES_REGEX = /(?: [1-2][09][0-2][0-9]) (\/.*)/;

const EDGE_CASES = {
  "An Evening with Silk Sonic ALBUM REVIEW": {
    artist: "Silk Sonic",
    title: "An Evening with Silk Sonic",
  },
  "Belle and Sebastian Write About Love ALBUM REVIEW": {
    artist: "Belle and Sebastian",
    title: "Belle and Sebastian Write About Love",
  },
  "Master Musicians of Bukkake-Totem 3 ALBUM REVIEW": {
    artist: "Master Musicians of Bukkake",
    title: "Totem 3",
  },
  "CX KiDTRONiK: KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF ALBUM REVIEW": {
    artist: "CX KiDTRONiK",
    title: "KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF",
  },
};

export {
  FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE,
  PRE_COSMOGRAMMA_REVIEW_REGEX,
  RATING_REGEX,
  NEW_REVIEW_TYPES,
  ARTIST_TITLE_REGEX,
  EDGE_CASES,
  GENRE_REGEX,
  GENRES_REGEX,
};
