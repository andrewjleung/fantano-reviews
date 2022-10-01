import { readFileSync } from 'fs';
import {
  spawnSync,
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from 'child_process';
import {
  always,
  Either,
  EitherAsync,
  Left,
  Nothing,
  Right,
  string,
} from 'purify-ts';
import dotenv from 'dotenv';
import { bindFalsyToEither } from './purifyUtils';
import { generateDatasets } from './datasetGenerator';
import { getAPIKey, getService } from './auth';
import { youtube_v3 } from 'googleapis';
import { getVideo } from './videoFetcher';
import { isReview } from './reviewParser';
import pubSubHubBub from 'pubsubhubbub';
import { XMLParser } from 'fast-xml-parser';

const DEFAULT_PORT = 8080;

dotenv.config();

const getConfig = (): Either<
  string,
  {
    channelId: string;
    playlistId: string;
    callbackUrl: string;
    videosFilename: string;
    reviewsFilename: string;
    ghPat: string;
    secret: string;
  }
> =>
  Right({})
    .chain(
      bindFalsyToEither(
        'channelId',
        process.env.THENEEDLEDROP_CHANNEL_ID,
        'Missing env variable "THENEEDLEDROP_CHANNEL_ID".',
      ),
    )
    .chain(
      bindFalsyToEither(
        'playlistId',
        process.env.THENEEDLEDROP_PLAYLIST_ID,
        'Missing env variable "THENEEDLEDROP_PLAYLIST_ID".',
      ),
    )
    .chain(
      bindFalsyToEither(
        'callbackUrl',
        process.env.CALLBACK_URL,
        'Missing env variable "CALLBACK_URL"',
      ),
    )
    .chain(
      bindFalsyToEither(
        'videosFilename',
        process.env.VIDEOS_FILENAME,
        'Missing env variable "VIDEOS_FILENAME".',
      ),
    )
    .chain(
      bindFalsyToEither(
        'reviewsFilename',
        process.env.REVIEWS_FILENAME,
        'Missing env variable "REVIEWS_FILENAME"',
      ),
    )
    .chain(
      bindFalsyToEither(
        'ghPat',
        process.env.GH_PAT,
        'Missing env variable "GH_PAT"',
      ),
    )
    .chain(
      bindFalsyToEither(
        'secret',
        process.env.SECRET,
        'Missing env variable "SECRET"',
      ),
    );

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

const checkForDuplicateVideo = (
  videoId: string,
  videosFilename: string,
): Either<string, string> => {
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

  return Right(videoId);
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

// TODO: Yes, this is wasteful in that the entire dataset is regenerated
// whenever there's a new video. However, considering Fantano's upload frequency
// and the number of videos he has, it is relatively inexpensive and scales very
// slowly. Contrary to the alternative approach of appending to the dataset and
// worrying about things like duplicates, git conflicts, etc., this seems like
// the easier approach for now.

const {
  channelId,
  playlistId,
  callbackUrl,
  videosFilename,
  reviewsFilename,
  ghPat,
  secret,
} = getConfig().unsafeCoerce();
cloneDataset(ghPat);
const service = getAPIKey().map(getService).unsafeCoerce();

const subscriber = pubSubHubBub.createServer({
  callbackUrl,
  // secret,
});

const subscribe = () => {
  subscriber.subscribe(
    `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
    'https://pubsubhubbub.appspot.com/',
    (err: unknown) => {
      if (err) {
        console.log(`Failed to subscribe to hub\n${err}`);
      }
    },
  );
};

subscribe();

subscriber.on('feed', (data: { feed: Buffer }) => {
  try {
    console.log('Notification received!');
    console.log(data);

    // Resubscribe. Trusting that Fantano uploads more frequently than the max
    // lease length, this will stay subscribed. Obviously, a cron job of some
    // sort or regularly restarting the server will do a better job here.
    subscribe();

    const parser = new XMLParser();
    const parsed = parser.parse(data.feed);
    const videoId = string.decode(parsed.feed.entry['yt:videoId']);
    console.log(parsed);

    EitherAsync.liftEither(
      pullLatestDataset()
        .chain(always(videoId))
        .chain((videoId) => checkForDuplicateVideo(videoId, videosFilename)),
    )
      .chain((videoId) => checkForReview(service, playlistId, videoId))
      .chain(() => generateDatasets(service, videosFilename, reviewsFilename))
      .chain(() => EitherAsync.liftEither(commitChanges()))
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
});

subscriber.on('subscribe', () => {
  console.log('Subscribed!');
});

console.log(
  `Debug publishing here:\nhttps://pubsubhubbub.appspot.com/subscription-details?hub.callback=${encodeURIComponent(
    callbackUrl,
  )}&hub.topic=${encodeURIComponent(
    `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
  )}&hub.secret=${secret}`,
);

subscriber.listen(Number(process.env.PORT || DEFAULT_PORT));
