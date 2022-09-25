import { youtube_v3 } from 'googleapis';
import { Just, List, Maybe, NonEmptyList, Nothing } from 'purify-ts';
import { bind, maybeOf } from './purifyUtils';
import { Review } from './types';

// This album has two "reviews" with the same title but different ratings.
// This processor chooses to ignore it.
const APRIL_FOOLS_REVIEW = "PLANNINGTOROCK - All Love's Legal ALBUM REVIEW";
const IGNORED_REVIEWS = [APRIL_FOOLS_REVIEW];

// A "new" review roughly follows the format:
// "<artist> - <title> <TYPE> REVIEW".
const NEW_REVIEW_TYPES = ['ALBUM', 'MIXTAPE', 'EP'];

// An "old" review roughly follows the format:
// "<artist>- <title> Review"
const OLD_REVIEW_TYPES = ['Album', 'Review'];

// Regex to match reviews before "Flying Lotus- Cosmogramma ALBUM REVIEW".
const PRE_COSMOGRAMMA_REVIEW_REGEX = /.+\- [^\"]+ Review.*/;

// Regex to match the rating of a review within its description.
const RATING_REGEX = /([0-9]|10)\/10(?!,)/;

// Regex to match the artist and album title of a review within its title.
// This matches against both old and new title formatting but doesn't catch some
// edge cases.
const ARTIST_TITLE_REGEX = RegExp(
  `(?:(.+)- (.+?(?= ${NEW_REVIEW_TYPES.join(
    '| ',
  )})))|(?:(.+)(?:-s+|: )(.+?(?= ${NEW_REVIEW_TYPES.join(
    '| ',
  )})))|(?:(.+)- (.+?(?= ${OLD_REVIEW_TYPES.join('| ')})))`,
);

// Review video titles that don't fit standard formatting.
const EDGE_CASES = new Map([
  [
    'An Evening with Silk Sonic ALBUM REVIEW',
    {
      artist: 'Silk Sonic',
      title: 'An Evening with Silk Sonic',
    },
  ],
  [
    'Belle and Sebastian Write About Love ALBUM REVIEW',
    {
      artist: 'Belle and Sebastian',
      title: 'Belle and Sebastian Write About Love',
    },
  ],
  [
    'Master Musicians of Bukkake-Totem 3 ALBUM REVIEW',
    {
      artist: 'Master Musicians of Bukkake',
      title: 'Totem 3',
    },
  ],
  [
    'CX KiDTRONiK: KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF ALBUM REVIEW',
    {
      artist: 'CX KiDTRONiK',
      title: 'KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF',
    },
  ],
]);

// Regex to match the genre and the artist's label in a review's description.
const GENRES_WITH_LABEL_REGEX = /(?: [1-2][09][0-2][0-9]) (\/.*)/;

// Regex to match the genre string with a review's description.
const GENRE_REGEX = /(?:\/ ([^\/]+))$/;

// Labels and genres in the descriptions of reviews are mixed together in a
// string of capitalized, slash-separated words. Genres are always comma
// delimited if there are multiple and usually come after the label in this
// sequence, but there are edge cases where either this ordering isn't followed
// or there are no genres, in which case it is difficult to recognize the
// distinction.
//
// These are labels that erroneously get recognized as genres since some reviews
// aren't tagged with genres. This is by no means comprehensive, there may still
// be some labels that don't get filtered out. The only downside here is that
// some reviews may have genres that aren't actually genres.
const LABELS = ['RECORDS', 'FORTUNA', 'DEAD OCEANS', 'PLUDERPHONICS'];

/**
 * Determine whether the given video title matches the format of a "new" review.
 * "New" reviews are considered to be all reviews since Flying Lotus'
 * "Cosmogramma," all of which follow the following format:
 *
 * <artist> - <title> <TYPE> REVIEW
 *
 * @param videoTitle the title of the video being checked
 * @returns whether the video title is that of a "new" review
 */
const isNewReview = (videoTitle: string): boolean =>
  NEW_REVIEW_TYPES.some((reviewType) =>
    videoTitle.includes(`${reviewType} REVIEW`),
  );

/**
 * Determine whether the given video title matches the format of an "old"
 * review. "Old" reviews are considered to be all reviews before Flying Lotus'
 * "Cosmogramma," all of which follow the following format:
 *
 * <artist>- <title> Review
 *
 * @param videoTitle the title of the video being checked
 * @returns whether the video title is that of an "old" review
 */
const isOldReview = (videoTitle: string): boolean =>
  PRE_COSMOGRAMMA_REVIEW_REGEX.test(videoTitle);

/**
 * Determine whether the given video is a review.
 *
 * @param video the video to check
 * @returns whether the given video is a review
 */
export const isReview = (video: youtube_v3.Schema$PlaylistItem): boolean =>
  Just({})
    .chain(bind('title', () => maybeOf(video.snippet?.title)))
    .chain(bind('description', () => maybeOf(video.snippet?.description)))
    .map(({ title, description }) => {
      if (IGNORED_REVIEWS.includes(title)) {
        return false;
      }

      const hasRating = RATING_REGEX.test(description);
      const isValidReview = isNewReview(title) || isOldReview(title);
      return isValidReview && hasRating;
    })
    .orDefault(false);

/**
 * Parse the number rating from the given video review description.
 *
 * @param description the description of a review video
 * @returns the rating of the review if present within the video description
 */
const getRating = (description: string): Maybe<number> =>
  maybeOf(description.match(RATING_REGEX))
    .chain((matchArray) => {
      if (matchArray.length < 2) {
        return Nothing;
      }

      return Just(matchArray[1]);
    })
    .chain((ratingString) => Maybe.encase(() => Number.parseInt(ratingString)));

/**
 * Parse genres from the given video review description.
 *
 * @param description the description of the review video
 * @returns an array of all the given genres within the video description
 */
const getGenres = (description: string): string[] => {
  const isGenre = (genre: string) =>
    genre.length > 0 && !LABELS.some((label) => genre.includes(label));

  const cleanGenre = (genre: string) => genre.trim().toLowerCase();

  return maybeOf(description.match(GENRES_WITH_LABEL_REGEX))
    .chain(List.head)
    .chainNullable((str) => str.match(GENRE_REGEX))
    .chain(List.at(1))
    .map((genres) => genres.split(', ').filter(isGenre).map(cleanGenre))
    .orDefault([]);
};

/**
 * Parse the artist and title from the given video review title.
 *
 * @param videoTitle the title of the review video
 * @returns the artist and title of the work being reviewed in the review video
 */
const getArtistAndTitle = (
  videoTitle: string,
): Maybe<{ artist: string; title: string }> => {
  const maybeEdgeCase = EDGE_CASES.get(videoTitle);

  if (maybeEdgeCase !== undefined) {
    return Just(maybeEdgeCase);
  }

  const maybeMatch = maybeOf(videoTitle.match(ARTIST_TITLE_REGEX));

  return maybeMatch
    .chain(List.at(1))
    .chain((artist) =>
      maybeMatch.chain(List.at(2)).map((title) => ({ artist, title })),
    );
};

/**
 * Parse review metadata from the given video review.
 *
 * @param video the video review to parse
 * @returns a review structure containing parsed metadata about the review
 */
export const parseReview = (
  video: youtube_v3.Schema$PlaylistItem,
): Maybe<Review> =>
  Just({})
    .chain(bind('videoTitle', () => maybeOf(video.snippet?.title)))
    .chain(bind('description', () => maybeOf(video.snippet?.description)))
    .chain(({ videoTitle, description }) =>
      Just({})
        .chain(bind('publishedAt', () => maybeOf(video.snippet?.publishedAt)))
        .chain((review) =>
          getArtistAndTitle(videoTitle).map((artistAndTitle) => ({
            ...review,
            ...artistAndTitle,
          })),
        )
        .chain((review) =>
          getRating(description).map((rating) => ({ ...review, rating })),
        )
        .map((review) => ({
          ...review,
          genres: getGenres(description).join(';'),
        })),
    );

/**
 * Parse reviews from the given list of videos, review or not.
 *
 * @param videos the videos to parse, can be a review or not
 * @returns an array containing all parsed reviews from the list
 */
export const parseReviews = (
  videos: youtube_v3.Schema$PlaylistItem[],
): Review[] =>
  Maybe.catMaybes(videos.filter(isReview).map(parseReview)).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
