import { readFileSync } from "fs";
import {
  FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE,
  PRE_COSMOGRAMMA_REVIEW_REGEX,
  RATING_REGEX,
  NEW_REVIEW_TYPES,
  ARTIST_TITLE_REGEX,
  EDGE_CASES,
  GENRE_REGEX,
  GENRES_REGEX,
} from "./constants.js";

// TODO: put this all in a class that lets you query things
// TODO: find a way to fetch this data dynamically instead of from a static JSON (need to worry about API limits...)

const isReview = (item) => {
  // April Fools edge case.
  if (item.snippet.title === "PLANNINGTOROCK - All Love's Legal ALBUM REVIEW") {
    return false;
  }

  const publishedAt = new Date(item.snippet.publishedAt);
  const title = item.snippet.title;

  const hasRating = RATING_REGEX.test(item.snippet.description);

  if (publishedAt.getTime() >= FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE.getTime()) {
    return (
      hasRating &&
      NEW_REVIEW_TYPES.reduce(
        (acc, type) => acc || title.includes(`${type} REVIEW`),
        false
      )
    );
  }

  return hasRating && PRE_COSMOGRAMMA_REVIEW_REGEX.test(title);
};

const cleanStringForCSV = (str) => `"${str.replaceAll('"', '""')}"`;

const getRating = (description) => {
  const ratingMatch = description.match(RATING_REGEX);

  return ratingMatch ? parseInt(ratingMatch[1]) : null;
};

const getGenres = (description) => {
  const allGenresMatch = description.match(GENRES_REGEX);
  const genres = allGenresMatch ? allGenresMatch[1].match(GENRE_REGEX) : null;

  const individualGenres = genres
    ? genres[2]
        .split(", ")
        .filter(
          (str) =>
            str.length > 0 &&
            !str.includes("RECORDS") &&
            !str.includes("FORTUNA") &&
            !str.includes("DEAD OCEANS") &&
            !str.includes("PLUNDERPHONICS") // this filtering of labels is not 100% comprehensive
        )
        .map((str) => str.trim().toLowerCase())
        .join("; ")
    : null;

  return individualGenres ? cleanStringForCSV(individualGenres) : null;
};

const getArtistAndTitle = (videoTitle) => {
  if (videoTitle in EDGE_CASES) {
    return [
      cleanStringForCSV(EDGE_CASES[videoTitle].artist),
      cleanStringForCSV(EDGE_CASES[videoTitle].title),
    ];
  }

  const match = videoTitle.match(ARTIST_TITLE_REGEX);
  const filteredMatch = match.filter((m) => !!m);
  const artist = cleanStringForCSV(filteredMatch[1].trim());
  const title = cleanStringForCSV(filteredMatch[2].trim());

  return [artist, title];
};

const cleanItem = (item) => {
  const keep = ["publishedAt", "title"];

  const snippet = item.snippet;
  const filtered = Object.keys(snippet)
    .filter((key) => keep.includes(key))
    .reduce((obj, key) => {
      obj[key] = snippet[key];
      return obj;
    }, {});

  filtered.rating = getRating(snippet.description);
  filtered.genres = getGenres(snippet.description);

  // TODO: add type of work property

  const [artist, title] = getArtistAndTitle(snippet.title);
  filtered.artist = artist;
  filtered.title = title;

  return filtered;
};

const compareByDate = (review1, review2) => {
  const rev1Date = new Date(review1.publishedAt);
  const rev2Date = new Date(review2.publishedAt);

  return rev1Date.getTime() > rev2Date.getTime();
};

const allFantanoVids = (filename) => JSON.parse(readFileSync(filename));

const getReviews = (filename) =>
  allFantanoVids(filename)
    .flat()
    .filter(isReview)
    .map(cleanItem)
    .sort(compareByDate);

export { getReviews };
