import { youtube_v3 } from 'googleapis';
import { parseReviews } from './reviewParser';
import { writeFileSync } from 'fs';
import { Review } from './types';
import { getAllPlaylistVideos } from './videoFetcher';
import { Either, EitherAsync, Nothing, Right } from 'purify-ts';
import { stringify } from 'csv-stringify/sync';

const THENEEDLEDROP_PLAYLIST_ID = 'UUt7fwAhXDy3oNFTAzF2o8Pw';

const reviewToRow = (review: Review) => ({
  ...review,
  rating: review.rating.toString(),
  genres: review.genres.join(';;'),
});

const writeVideoDatasetJSON = (
  videos: youtube_v3.Schema$PlaylistItem[],
  outputFilename: string,
): Either<string, typeof Nothing> => {
  console.log(`Outputting all videos to ${outputFilename}`);

  return Either.encase(() => {
    writeFileSync(outputFilename, JSON.stringify(videos) + '\n', {
      encoding: 'utf-8',
      flag: 'w',
    });
    return Nothing;
  }).mapLeft((e) => e.message);
};

const writeReviewDatasetCSV = (
  videos: youtube_v3.Schema$PlaylistItem[],
  outputFilename: string,
): Either<string, typeof Nothing> => {
  console.log('Creating review dataset from videos');

  const reviews = parseReviews(videos);

  if (reviews.length < 1) {
    console.log('No reviews to write.');
    return Right(Nothing);
  }

  const header = Object.keys(reviews[0]);
  const body = reviews.map(reviewToRow).map(Object.values);
  const csv = stringify([header, ...body]);

  return Either.encase(() => {
    writeFileSync(outputFilename, csv, {
      encoding: 'utf-8',
      flag: 'w',
    });
    return Nothing;
  }).mapLeft((e) => e.message);
};

export const generateDatasets = (
  service: youtube_v3.Youtube,
  videosFilename: string,
  reviewsFilename: string,
): Promise<Either<string, typeof Nothing>> =>
  EitherAsync.fromPromise(() =>
    getAllPlaylistVideos(service)(THENEEDLEDROP_PLAYLIST_ID),
  )
    .chain((videos) =>
      EitherAsync.liftEither(
        Right(Nothing)
          .chain(() => writeVideoDatasetJSON(videos, videosFilename))
          .chain(() => writeReviewDatasetCSV(videos, reviewsFilename)),
      ),
    )
    .run();
