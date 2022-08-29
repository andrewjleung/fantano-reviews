import { createServer } from 'pubsubhubbub';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import { spawnSync } from 'child_process';

const PORT = 3000;

const MAX_LEASE_S = 828000;
const THENEEDLEDROP_ID = 'UCt7fwAhXDy3oNFTAzF2o8Pw';
const TOPIC = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${THENEEDLEDROP_ID}`;
const HUB = 'https://pubsubhubbub.appspot.com/subscribe';
const CALLBACK_URL = 'https://tnd-sub.onrender.com';
const NOT_REVIEW_ERR_CODE = 8;

const allVideos = JSON.parse(fs.readFileSync('../tnd-reviews/all_videos.json'));
const videoIds = new Set(
  allVideos.map((video) => video.contentDetails.videoId),
);

const subscriber = createServer({
  leaseSeconds: MAX_LEASE_S,
});
const parser = new XMLParser();

const subscribe = () => {
  subscriber.subscribe(TOPIC, HUB, CALLBACK_URL, () => {
    console.log('Subscribed!');
  });
};

// TODO: Log this in a more organized way.
subscriber.on('feed', ({ topic, hub, callback, feed, headers }) => {
  try {
    console.log('Notification received!');
    console.log(feed.toString());

    // Resubscribe. Trusting that Fantano uploads more frequently than the max
    // lease length, this will stay subscribed. Obviously, a cron job of some
    // sort or regularly restarting the server will do a better job here.
    subscribe();

    const notification = parser.parse(feed);
    const maybeVideoId = notification.feed?.entry?.['yt:videoId'];

    if (!maybeVideoId) {
      console.log(`Failed to access video ID in notification: ${notification}`);
      return;
    }

    // The YouTube Data API publishes notifications to subscribers whenever
    // videos are uploaded or have their titles/descriptions modified. This
    // means that the same video may be received twice. These videos are
    // ignored, using the videos JSON dataset to determine what videos have
    // already been processed.
    if (videoIds.has(maybeVideoId)) {
      console.log(`Video ${maybeVideoId} has already been processed.`);
      return;
    }

    const spawnOptions = {
      stdio: ['inherit', 'inherit', 'pipe'],
    };

    console.log(`Attempting to parse review from video ${maybeVideoId}.`);

    const addReview = spawnSync(
      '../scripts/add-review.sh',
      [maybeVideoId],
      spawnOptions,
    );

    if (addReview.status === NOT_REVIEW_ERR_CODE) {
      console.log(`Video ${maybeVideoId} is not a review.`);
      return;
    }

    if (addReview.status !== 0) {
      console.error('An error occurred adding the review to the dataset.');
      return;
    }

    console.log('Review added to the dataset.');

    const commitChanges = spawnSync('../scripts/commit.sh', spawnOptions);

    if (commitChanges.status !== 0) {
      console.error('An error occurred committing changes to the dataset.');
      return;
    }

    console.log('Changes committed to the dataset.');
  } catch (e) {
    console.error('An error occurred: ', e);
  }
});

subscribe();
subscriber.listen(PORT);
