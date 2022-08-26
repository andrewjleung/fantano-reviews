import { createServer } from 'pubsubhubbub';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 3000;

const THENEEDLEDROP_ID = 'UCt7fwAhXDy3oNFTAzF2o8Pw';
const TOPIC = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${THENEEDLEDROP_ID}`;
const HUB = 'https://pubsubhubbub.appspot.com/subscribe';
const CALLBACK_URL = 'https://tnd-sub.onrender.com';

const allVideos = JSON.parse(fs.readFileSync('../tnd-reviews/all_videos.json'));
const videoIds = new Set(
  allVideos.map((video) => video.contentDetails.videoId),
);

const subscriber = createServer({});
const parser = new XMLParser();

// subscriber.subscribe(TOPIC, HUB, CALLBACK_URL, () => {
//   console.log('subscribed!');
// });

// // TODO: Log this in a more organized way.
// subscriber.on('feed', ({ topic, hub, callback, feed, headers }) => {
//   console.log('Notification received!');
//   console.log(feed.toString());

//   const notification = parser.parse(feed);
//   const maybeVideoId = notification.feed?.entry?.['yt:videoId'];

//   if (!maybeVideoId) {
//     console.log(`Failed to access video ID in notification: ${notification}`);
//     return;
//   }

//   if (videoIds.has(maybeVideoId)) {
//     console.log(`Video ${maybeVideoId} has already been added.`);
//     return;
//   }

//   console.log(`Adding video ${maybeVideoId} to the dataset.`);
//   const addReview = spawn('../scripts/add-review.sh', [maybeVideoId]);

//   addReview.on('exit', () => {
//     console.log('Committing changes to the dataset.');
//     spawn('../scripts/commit.sh');
//   });
// });

// subscriber.listen(PORT);

const maybeVideoId = '645qisC4slI';

console.log(`Adding video ${maybeVideoId} to the dataset.`);
const addReview = spawn('../scripts/add-review.sh', [maybeVideoId]);

addReview.on('exit', () => {
  console.log('Committing changes to the dataset.');
  spawn('../scripts/commit.sh');
});
