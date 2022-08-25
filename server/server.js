import { createServer } from 'pubsubhubbub';

const THENEEDLEDROP_ID = 'UCt7fwAhXDy3oNFTAzF2o8Pw';
const TOPIC = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${THENEEDLEDROP_ID}`;
const HUB = 'https://pubsubhubbub.appspot.com/subscribe';
const CALLBACK_URL = 'https://andrewjleung.me/tndreviews';

const subscriber = createServer({});

subscriber.subscribe(TOPIC, HUB, CALLBACK_URL, () => {
  console.log('subscribed!');
});

subscriber.on('feed', ({ topic, hub, callback, feed, headers }) => {
  console.log(feed.toString());
});

subscriber.listen(3000);
