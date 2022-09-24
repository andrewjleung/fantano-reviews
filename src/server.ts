import Notifier from '@daangamesdg/youtube-notifications';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process';
import { always, Either, Left, Nothing, Right } from 'purify-ts';

const THENEEDLEDROP_ID = 'UCt7fwAhXDy3oNFTAzF2o8Pw';
const CALLBACK_URL = 'https://tnd-sub.onrender.com';
const NOT_REVIEW_ERR_CODE = 8;

const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  stdio: 'inherit',
};

const pullLatestDataset = (): Either<string, typeof Nothing> => {
  const child = spawnSync('cd ../tnd-reviews & git pull', spawnOptions);

  if (child.status !== 0) {
    return Left(
      `An error occurred pulling latest changes for the dataset: ${child.stderr}`,
    );
  }

  return Right(Nothing);
};

const checkForDuplicateVideo = (videoId: string): Either<string, string> => {
  const allVideoIds = JSON.parse(
    readFileSync('../tnd-reviews/all_videos.json', 'utf-8'),
  );

  if (!Array.isArray(allVideoIds)) {
    return Left(
      'Video ids are not in an array. Please check the `all_videos.json` file.',
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

  return Right(videoId);
};

const addReview = (videoId: string): Either<string, typeof Nothing> => {
  const child = spawnSync('../scripts/add-review.sh', [videoId], spawnOptions);

  if (child.status === NOT_REVIEW_ERR_CODE) {
    return Left(`Video ${videoId} is not a review`);
  }

  if (child.status !== 0) {
    return Left(
      `An error occurred adding the review to the dataset: ${child.stderr}`,
    );
  }

  return Right(Nothing);
};

const commitChanges = (): Either<string, typeof Nothing> => {
  const child = spawnSync('../scripts/commit.sh', spawnOptions);

  if (child.status !== 0) {
    return Left(
      `An error occurred committing changes to the dataset: ${child.stderr}`,
    );
  }

  return Right(Nothing);
};

const secret = randomBytes(48).toString('hex');

const notifier = new Notifier({
  hubCallback: CALLBACK_URL,
  secret,
});

notifier.setup();

// TODO: Log this in a more organized way.
notifier.on('notified', (data) => {
  try {
    console.log('Notification received!');
    console.log(data);

    // Resubscribe. Trusting that Fantano uploads more frequently than the max
    // lease length, this will stay subscribed. Obviously, a cron job of some
    // sort or regularly restarting the server will do a better job here.
    notifier.subscribe(THENEEDLEDROP_ID);

    pullLatestDataset()
      .map(always(data.video.id))
      .chain(checkForDuplicateVideo)
      .chain(addReview)
      .chain(commitChanges)
      .caseOf({
        Left: (msg) => {
          console.error(msg);
        },
        Right: () => {
          console.log('Successfully updated dataset.');
        },
      });
  } catch (e) {
    console.error('An error occurred: ', e);
  }
});

notifier.subscribe(THENEEDLEDROP_ID);
