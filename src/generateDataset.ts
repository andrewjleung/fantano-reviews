import { google, youtube_v3 } from 'googleapis';
import { parseReviews } from './reviewParser';
import { writeFileSync } from 'fs';
import { Review } from './types';
import dotenv from 'dotenv';
import { getAllPlaylistVideos } from './videoFetcher';
import { Either, EitherAsync, Maybe, Nothing, Right } from 'purify-ts';

const VIDEOS_FILENAME = './all_videos.json';
const REVIEWS_FILENAME = './reviews.csv';
const THENEEDLEDROP_PLAYLIST_ID = 'UUt7fwAhXDy3oNFTAzF2o8Pw';

const reviewToString = (review: Review): string =>
  Object.values(review)
    .map((value) => value.toString())
    .join(',');

const writeVideoDatasetJSON = (
  videos: youtube_v3.Schema$PlaylistItem[],
  outputFilename: string,
): Either<Error, typeof Nothing> => {
  console.log(`Outputting all videos to ${VIDEOS_FILENAME}`);

  return Either.encase(() => {
    writeFileSync(outputFilename, JSON.stringify(videos), {
      encoding: 'utf-8',
      flag: 'w',
    });
    return Nothing;
  });
};

const writeReviewDatasetCSV = (
  videos: youtube_v3.Schema$PlaylistItem[],
  outputFilename: string,
): Either<Error, typeof Nothing> => {
  console.log('Creating review dataset from videos');

  const reviews = parseReviews(videos);

  if (reviews.length < 1) {
    console.log('No reviews to write.');
    return Right(Nothing);
  }

  const header = Object.keys(reviews[0]).join(',');
  const body = reviews.map(reviewToString).join('\n');

  return Either.encase(() => {
    writeFileSync(outputFilename, `${header}\n${body}`, {
      encoding: 'utf-8',
      flag: 'w',
    });
    return Nothing;
  });
};

const fetchAPIKey = (): Either<Error, string> =>
  Maybe.fromFalsy(process.env.YTV3_API_KEY).toEither(
    Error('No API key supplied for the YouTube V3 API.'),
  );

const getService = (apiKey: string): youtube_v3.Youtube => {
  const googleAuth = new google.auth.GoogleAuth();
  const jwt = googleAuth.fromAPIKey(apiKey);

  return new youtube_v3.Youtube({
    auth: jwt,
  });
};

dotenv.config();

EitherAsync.liftEither(fetchAPIKey())
  .map(getService)
  .chain((service) => getAllPlaylistVideos(service)(THENEEDLEDROP_PLAYLIST_ID))
  .chain((videos) =>
    EitherAsync.liftEither(
      Right(Nothing)
        .chain(() => writeVideoDatasetJSON(videos, VIDEOS_FILENAME))
        .chain(() => writeReviewDatasetCSV(videos, REVIEWS_FILENAME)),
    ),
  )
  .run()
  .then((value) =>
    value.caseOf({
      Left: (e) => {
        throw e;
      },
      Right: () => {},
    }),
  );
