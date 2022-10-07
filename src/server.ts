import { getAPIKey, getService } from './auth';
import { makeServer, makeSubscribe } from './pubsubhubbub';
import getConfig from './config';
import getNotificationProcessor from './processNotification';

const DEFAULT_PORT = 8080;
const MAX_LEASE_S = 828000;
const HUB = 'https://pubsubhubbub.appspot.com';
const HOST = '0.0.0.0';

const config = getConfig().unsafeCoerce();
const { callbackUrl, secret, channelId } = config;
const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
const service = getAPIKey().map(getService).unsafeCoerce();

const subscribe = makeSubscribe(HUB, callbackUrl, topic, MAX_LEASE_S, secret);

const processNotification = getNotificationProcessor(
  service,
  config,
  subscribe,
);

const server = await makeServer({
  topic: topic,
  onData: processNotification,
});

subscribe();

console.log(
  `Debug publishing here:\n${HUB}/subscription-details?hub.callback=${encodeURIComponent(
    callbackUrl,
  )}&hub.topic=${encodeURIComponent(topic)}&hub.secret=${encodeURIComponent(
    secret,
  )}`,
);

server.listen({
  port: Number(process.env.PORT || DEFAULT_PORT),
  host: HOST,
});
