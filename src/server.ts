import Notifier from '@daangamesdg/youtube-notifications';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import {
  spawnSync,
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from 'child_process';
import { always, Either, EitherAsync, Left, Nothing, Right } from 'purify-ts';
import dotenv from 'dotenv';
import { bindFalsyToEither } from './purifyUtils';
import { generateDatasets } from './datasetGenerator';
import { getAPIKey, getService } from './auth';
import { youtube_v3 } from 'googleapis';
import { getVideo } from './videoFetcher';
import { isReview } from './reviewParser';

dotenv.config();

const getConfig = (): Either<
  Error,
  {
    channelId: string;
    playlistId: string;
    callbackUrl: string;
    videosFilename: string;
    reviewsFilename: string;
  }
> =>
  Right({})
    .chain(
      bindFalsyToEither(
        'channelId',
        process.env.THENEEDLEDROP_CHANNEL_ID,
        Error('Missing env variable "THENEEDLEDROP_CHANNEL_ID".'),
      ),
    )
    .chain(
      bindFalsyToEither(
        'playlistId',
        process.env.THENEEDLEDROP_PLAYLIST_ID,
        Error('Missing env variable "THENEEDLEDROP_PLAYLIST_ID".'),
      ),
    )
    .chain(
      bindFalsyToEither(
        'callbackUrl',
        process.env.CALLBACK_URL,
        Error('Missing env variable "CALLBACK_URL"'),
      ),
    )
    .chain(
      bindFalsyToEither(
        'videosFilename',
        process.env.VIDEOS_FILENAME,
        Error('Missing env variable "VIDEOS_FILENAME".'),
      ),
    )
    .chain(
      bindFalsyToEither(
        'reviewsFilename',
        process.env.REVIEWS_FILENAME,
        Error('Missing env variable "REVIEWS_FILENAME"'),
      ),
    );

const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  stdio: 'inherit',
};

const logChild = (child: SpawnSyncReturns<string>) =>
  JSON.stringify(child, null, 2);

const pullLatestDataset = (): Either<Error, typeof Nothing> => {
  console.log('Pulling latest changes to datasets.');
  const child = spawnSync('git', ['pull'], {
    ...spawnOptions,
    cwd: './tnd-reviews',
  });

  if (child.status !== 0) {
    return Left(
      Error(
        `An error occurred pulling latest changes for the dataset:\n${logChild(
          child,
        )}`,
      ),
    );
  }

  return Right(Nothing);
};

const checkForDuplicateVideo = (
  videoId: string,
  videosFilename: string,
): Either<Error, string> => {
  const allVideoIds = JSON.parse(
    readFileSync(`./tnd-reviews/${videosFilename}`, 'utf-8'),
  );

  if (!Array.isArray(allVideoIds)) {
    return Left(
      Error(
        `Video ids are not in an array. Please check the \`${videosFilename}\` file.`,
      ),
    );
  }

  const videoIds = allVideoIds.map((video) => video.contentDetails.videoId);

  // The YouTube Data API publishes notifications to subscribers whenever
  // videos are uploaded or have their titles/descriptions modified. This
  // means that the same video may be received twice. These videos are
  // ignored, using the videos JSON dataset to determine what videos have
  // already been processed.
  if (videoIds.includes(videoId)) {
    return Left(Error(`Video ${videoId} has already been processed.`));
  }

  return Right(videoId);
};

const checkForReview = async (
  service: youtube_v3.Youtube,
  playlistId: string,
  videoId: string,
): Promise<Either<Error, typeof Nothing>> => {
  const video = await getVideo(service)(playlistId, videoId);

  return video
    .map(isReview)
    .chain((isReview) =>
      isReview
        ? Right(Nothing)
        : Left(Error(`Video ${videoId} is not a review.`)),
    );
};

const commitChanges = (): Either<Error, typeof Nothing> => {
  console.log('Committing changes to datasets.');
  const child = spawnSync('./scripts/commit.sh', spawnOptions);

  if (child.status !== 0) {
    return Left(
      Error(
        `An error occurred committing changes to the dataset:\n${logChild(
          child,
        )}`,
      ),
    );
  }

  return Right(Nothing);
};

// TODO: Yes, this is wasteful in that the entire dataset is regenerated
// whenever there's a new video. However, considering Fantano's upload frequency
// and the number of videos he has, it is relatively inexpensive and scales very
// slowly. Contrary to the alternative approach of appending to the dataset and
// worrying about things like duplicates, git conflicts, etc., this seems like
// the easier approach for now.

const { channelId, playlistId, callbackUrl, videosFilename, reviewsFilename } =
  getConfig().unsafeCoerce();
const service = getAPIKey().map(getService).unsafeCoerce();
const secret = randomBytes(48).toString('hex');

const notifier = new Notifier({
  hubCallback: callbackUrl,
  secret,
});

notifier.setup();

notifier.on('notified', (data) => {
  try {
    console.log('Notification received!');
    console.log(data);

    // Resubscribe. Trusting that Fantano uploads more frequently than the max
    // lease length, this will stay subscribed. Obviously, a cron job of some
    // sort or regularly restarting the server will do a better job here.
    notifier.subscribe(channelId);

    EitherAsync.liftEither(
      pullLatestDataset()
        .map(always(data.video.id))
        .chain((videoId) => checkForDuplicateVideo(videoId, videosFilename)),
    )
      .chain(() => checkForReview(service, playlistId, data.video.id))
      .chain(() => generateDatasets(service, videosFilename, reviewsFilename))
      .chain(() => EitherAsync.liftEither(commitChanges()))
      .run()
      .then((value) =>
        value.caseOf({
          Left: (e) => {
            console.error(e.message);
          },
          Right: () => {
            console.log('Successfully updated dataset.');
          },
        }),
      );
  } catch (e) {
    console.error('An error occurred: ', e);
  }
});

notifier.subscribe(channelId);
