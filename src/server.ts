import { getAPIKey, getService } from './auth';
import { createServer } from 'pubsubhubbub';
import getConfig from './config';
import getNotificationProcessor from './processNotification';
import { XMLParser } from 'fast-xml-parser';

const DEFAULT_PORT = 8080;
const MAX_LEASE_S = 828000;
const HUB = 'https://pubsubhubbub.appspot.com/subscribe';

const config = getConfig().unsafeCoerce();
const { callbackUrl, secret } = config;
const service = getAPIKey().map(getService).unsafeCoerce();

const subscriber = createServer({
  callbackUrl,
  leaseSeconds: MAX_LEASE_S,
  secret,
});

const subscribe = () => {
  subscriber.subscribe(
    `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
    HUB,
    (err: unknown) => {
      if (err) {
        console.log(`Failed to subscribe to hub\n${err}`);
      }
    },
  );
};

subscriber.subscribe = subscribe;

const parser = new XMLParser();

const processNotification = getNotificationProcessor(
  parser,
  subscriber,
  service,
  config,
);

subscriber.on('listen', () => {
  console.log('Callback server listening!');
  subscribe();
});

subscriber.on('denied', (data: unknown) => {
  console.log(`Subscription has been denied:\n${data}`);
});

subscriber.on('error', (data: unknown) => {
  console.log(`An error has occurred:\n${data}`);
});

subscriber.on('feed', processNotification);

subscriber.on('subscribe', () => {
  console.log('Subscribed!');
});

console.log(
  `Debug publishing here:\nhttps://pubsubhubbub.appspot.com/subscription-details?hub.callback=${encodeURIComponent(
    callbackUrl,
  )}&hub.topic=${encodeURIComponent(
    `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
  )}&hub.secret=${encodeURIComponent(secret)}`,
);

subscriber.listen(Number(process.env.PORT || DEFAULT_PORT));
