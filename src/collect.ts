import {
  ClassicReview,
  NotGoodReview,
  Review,
  ReviewRow,
  ReviewRowRating,
  StandardReview,
  TensReview,
} from './types';

const getKey = (artist: string, title: string): string => `${artist}::${title}`;

// The ordering of precedence for merging the data of multiple reviews.
const RATING_PRECEDENCE: ReviewRowRating[] = [
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  0,
  'NOT GOOD',
  'CLASSIC',
];

const mergeRows = (row1: ReviewRow, row2: ReviewRow): ReviewRow => ({
  ...row1,
  rating: row2.rating,
  genres: Array.from(new Set([...row1.genres, ...row2.genres])),
  publishedAt: row2.publishedAt,
});

/**
 * Collect the given review row into the given collection of rows.
 *
 * Rows are either added right to the collection if they don't already exist or
 * merged in precedence based upon rating. This is meant to resolve cases where
 * reviews have data spread across multiple videos, though the likely case is
 * when an album has both a 'CLASSIC' review and a 'These albums are 10s'
 * review.
 *
 * @param rows a mapping from artist/title to review data to collect to
 * @param row the review data to collect
 * @returns the updated mapping (mutated)
 */
const collectReview = (
  rows: Map<string, ReviewRow>,
  row: ReviewRow,
): Map<string, ReviewRow> => {
  const key = getKey(row.artist, row.title);
  const existingRow = rows.get(key);

  if (existingRow === undefined) {
    rows.set(key, row);
    return rows;
  }

  // NOTE: This is an overly cautious way of merging things. In reality, it's
  // probably quite unlikely for a single work to get say, both a 'NOT GOOD' and
  // a 'CLASSIC' rating across different reviews.
  if (
    RATING_PRECEDENCE.indexOf(row.rating) <=
    RATING_PRECEDENCE.indexOf(existingRow.rating)
  ) {
    rows.set(key, mergeRows(existingRow, row));
    return rows;
  }

  rows.set(key, mergeRows(row, existingRow));
  return rows;
};

const standardReviewToRow = (review: StandardReview): ReviewRow => {
  const { type, ...row } = review;
  return row;
};

// TODO: Abstract these two functions.
const classicReviewToRow = (review: ClassicReview): ReviewRow => {
  const { type, ...row } = review;
  return {
    ...row,
    rating: 'CLASSIC',
  };
};

const notGoodReviewToRow = (review: NotGoodReview): ReviewRow => {
  const { type, ...row } = review;
  return {
    ...row,
    rating: 'NOT GOOD',
  };
};

const tensReviewToRows = (review: TensReview): ReviewRow[] =>
  review.albums.map((artistAndTitle) => ({
    ...artistAndTitle,
    rating: 10,
    genres: [],
    publishedAt: review.publishedAt,
  }));

// TODO: Look into using a visitor pattern here, this would involve a refactor
// to parse reviews into some sort of review class.
// TODO: Test.
export default function collect(
  rows: Map<string, ReviewRow>,
  review: Review,
): Map<string, ReviewRow> {
  if (review.type === 'standard') {
    const row = standardReviewToRow(review);
    return collectReview(rows, row);
  } else if (review.type === 'classic') {
    const row = classicReviewToRow(review);
    return collectReview(rows, row);
  } else if (review.type === 'not-good') {
    const row = notGoodReviewToRow(review);
    return collectReview(rows, row);
  } else {
    const newRows = tensReviewToRows(review);
    newRows.forEach((row) => collectReview(rows, row));
    return rows;
  }
}
