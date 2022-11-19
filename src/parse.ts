import { Either, Left } from 'purify-ts';
import {
  ClassicReview,
  NotGoodReview,
  StandardReview,
  TensReview,
  Video,
} from './types';

// A "new" review roughly follows the format:
// "<artist> - <title> <TYPE> REVIEW".
const NEW_REVIEW_TYPES = ['ALBUM', 'MIXTAPE', 'EP'];

// Regex to match reviews before "Flying Lotus- Cosmogramma ALBUM REVIEW".
const PRE_COSMOGRAMMA_REVIEW_REGEX = /.+\- [^\"]+ Review.*/;

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

// TODO: Implement.
const isClassicReview = (videoTitle: string): boolean => false;

// TODO: Implement.
const isNotGoodReview = (videoTitle: string): boolean => false;

/**
 * Determine whether the given video title matches the format of a 10s review.
 * Fantano went through a handful of albums across a few decades within isolated
 * videos, giving each of them 10s.
 *
 * @param videoTitle the title of the video being checked
 * @returns whether the video title is that of a 10s review
 */
const isTensReview = (videoTitle: string): boolean =>
  videoTitle.includes('These Albums are 10s');

const parseNewReview = ({
  title: videoTitle,
  description,
  publishedAt,
}: Video): Either<string, StandardReview> => {
  return Left('Unimplemented.');
};
const parseOldReview = ({
  title: videoTitle,
  description,
  publishedAt,
}: Video): Either<string, StandardReview> => {
  return Left('Unimplemented.');
};

const parseClassicReview = ({
  title: videoTitle,
  description,
  publishedAt,
}: Video): Either<string, ClassicReview> => {
  return Left('Unimplemented.');
};

const parseNotGoodReview = ({
  title: videoTitle,
  description,
  publishedAt,
}: Video): Either<string, NotGoodReview> => {
  return Left('Unimplemented.');
};

const parseTensReview = ({
  title: videoTitle,
  description,
  publishedAt,
}: Video): Either<string, TensReview> => {
  return Left('Unimplemented.');
};
