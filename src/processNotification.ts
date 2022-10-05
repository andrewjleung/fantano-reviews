import { readFileSync } from 'fs';
import {
  spawnSync,
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from 'child_process';
import { youtube_v3 } from 'googleapis';
import {
  Codec,
  Either,
  EitherAsync,
  Left,
  Nothing,
  Right,
  string,
} from 'purify-ts';
import { getVideo } from './videoFetcher';
import { isReview } from './reviewParser';
import { Config } from './config';
import { generateDatasets } from './datasetGenerator';

const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  stdio: 'inherit',
};

const logChild = (child: SpawnSyncReturns<string>) =>
  JSON.stringify(child, null, 2);

const cloneDataset = (ghPat: string): Either<string, typeof Nothing> => {
  console.log('Setting up git and cloning dataset.');
  const child = spawnSync('./scripts/setup-git.sh', [ghPat], {
    ...spawnOptions,
  });

  if (child.status !== 0) {
    return Left(
      `An error occurred setting up git and cloning the dataset:\n${logChild(
        child,
      )}`,
    );
  }

  return Right(Nothing);
};

const pullLatestDataset = (): Either<string, typeof Nothing> => {
  console.log('Pulling latest changes to datasets.');
  const child = spawnSync('git', ['pull'], {
    ...spawnOptions,
    cwd: './tnd-reviews',
  });

  if (child.status !== 0) {
    return Left(
      `An error occurred pulling latest changes for the dataset:\n${logChild(
        child,
      )}`,
    );
  }

  return Right(Nothing);
};

const checkDuplicateVideo = (
  videoId: string,
  videosFilename: string,
): Either<string, typeof Nothing> => {
  const allVideoIds = JSON.parse(
    readFileSync(`./tnd-reviews/${videosFilename}`, 'utf-8'),
  );

  if (!Array.isArray(allVideoIds)) {
    return Left(
      `Video ids are not in an array. Please check the \`${videosFilename}\` file.`,
    );
  }

  const videoIds = allVideoIds.map((video) => video.contentDetails.videoId);

  // The YouTube Data API publishes notifications to subscribers whenever
  // videos are uploaded or have their titles/descriptions modified. This
  // means that the same video may be received twice. These videos are
  // ignored, using the videos JSON dataset to determine what videos have
  // already been processed.
  if (videoIds.includes(videoId)) {
    return Left(`Video ${videoId} has already been processed.`);
  }

  return Right(Nothing);
};

const checkForReview = async (
  service: youtube_v3.Youtube,
  playlistId: string,
  videoId: string,
): Promise<Either<string, typeof Nothing>> => {
  const video = await getVideo(service)(playlistId, videoId);

  return video
    .map(isReview)
    .chain((isReview) =>
      isReview ? Right(Nothing) : Left(`Video ${videoId} is not a review.`),
    );
};

const commitChanges = (): Either<string, typeof Nothing> => {
  console.log('Committing changes to datasets.');
  const child = spawnSync('./scripts/commit.sh', spawnOptions);

  if (child.status !== 0) {
    return Left(
      `An error occurred committing changes to the dataset:\n${logChild(
        child,
      )}`,
    );
  }

  return Right(Nothing);
};

const Notification = Codec.interface({
  feed: Codec.interface({
    entry: Codec.interface({
      'yt:videoId': string,
    }),
  }),
});

// TODO: Yes, this is wasteful in that the entire dataset is regenerated
// whenever there's a new video. However, considering Fantano's upload frequency
// and the number of videos he has, it is relatively inexpensive and scales very
// slowly. Contrary to the alternative approach of appending to the dataset and
// worrying about things like duplicates, git conflicts, etc., this seems like
// the easier approach for now.

const getNotificationProcessor = (
  service: youtube_v3.Youtube,
  config: Config,
  subscribe: () => void,
) => {
  const { playlistId, videosFilename, reviewsFilename, ghPat } = config;
  cloneDataset(ghPat);

  // TODO: remove any
  return (notification: unknown) => {
    try {
      console.log('Notification received!');
      console.log(notification);

      // Resubscribe. Trusting that Fantano uploads more frequently than the max
      // lease length, this will stay subscribed. Obviously, a cron job of some
      // sort or regularly restarting the server will do a better job here.
      subscribe();

      const videoId = Notification.decode(notification)
        .map((notification) => notification.feed.entry['yt:videoId'])
        .unsafeCoerce();

      const lift = EitherAsync.liftEither;

      lift(Right(Nothing))
        .chain(() => lift(pullLatestDataset()))
        .chain(() => lift(checkDuplicateVideo(videoId, videosFilename)))
        .chain(() => checkForReview(service, playlistId, videoId))
        .chain(() => generateDatasets(service, videosFilename, reviewsFilename))
        .chain(() => lift(commitChanges()))
        .run()
        .then((value) =>
          value.caseOf({
            Left: (e) => {
              console.error(e);
            },
            Right: () => {
              console.log('Successfully updated dataset.');
            },
          }),
        );
    } catch (e) {
      console.error('An error occurred: ', e);
    }
  };
};

export default getNotificationProcessor;
