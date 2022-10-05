import got, { OptionsInit } from 'got';
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import crypto from 'crypto';
import { maybeOf } from './purifyUtils';
import {
  ContentDistributionRequestHeaders,
  GetResponseQuery,
  PubSubHubBubConfig,
} from './types';
import fastifyXMLBodyParser from 'fastify-xml-body-parser';

const isSignatureCorrect = (
  signature: string,
  body: unknown,
  secret: string,
): boolean => {
  // Recompute the SHA1 signature using the secret and the body of the content
  // distribution request.
  const hmac = crypto.createHmac('sha1', secret);
  hmac.write(body);
  hmac.end();
  const hash = hmac.read().toString('hex');

  // Compare the provided signature and the recomputed one.
  return crypto.timingSafeEqual(
    Buffer.from(`sha1=${hash}`),
    Buffer.from(signature),
  );
};

export const makeSubscribe =
  (
    hubUrl: string,
    callbackUrl: string,
    topic: string,
    leaseSeconds?: number,
    secret?: string,
  ) =>
  () => {
    const searchParams = new URLSearchParams([
      ['hub.callback', callbackUrl],
      ['hub.mode', 'subscribe'],
      ['hub.topic', topic],
    ]);

    if (leaseSeconds !== undefined) {
      searchParams.append('hub.lease_seconds', leaseSeconds.toString());
    }

    if (secret !== undefined) {
      searchParams.append('hub.secret', secret);
    }

    const options: OptionsInit = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      searchParams,
    };

    return got.post(hubUrl, options);
  };

export const makeServer = ({ topic, onData, secret }: PubSubHubBubConfig) => {
  const server = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  server.register(fastifyXMLBodyParser, {
    contentType: 'application/atom+xml',
  });

  server.get(
    '/',
    {
      schema: {
        querystring: GetResponseQuery,
      },
    },
    (request, reply) => {
      const handleDenied = () => {
        if (request.query['hub.reason'] === undefined) {
          console.log('Subscription denied with no provided reason.');
        } else {
          console.log(`Subscription denied:\n${request.query['hub.reason']}`);
        }
      };

      const handleSubscribeVerification = () => {
        if (request.query['hub.challenge'] === undefined) {
          throw new Error('Missing challenge from verification of intent.');
        }

        if (request.query['hub.lease_seconds'] === undefined) {
          throw new Error('Missing lease length from verification of intent.');
        }

        if (request.query['hub.topic'] !== topic) {
          reply.code(404).send();
        } else {
          reply.code(200).send(request.query['hub.challenge']);
        }
      };

      switch (request.query['hub.mode']) {
        case 'denied':
          handleDenied();
          break;
        case 'subscribe':
          handleSubscribeVerification();
          break;
        case 'unsubscribe':
          console.log('Unsubscribe handler unimplemented.');
          break;
        default:
          throw new Error(
            `Unrecognized mode received from hub: ${request.query['hub.mode']}`,
          );
      }
    },
  );

  server.post(
    '/',
    {
      schema: {
        headers: ContentDistributionRequestHeaders,
      },
    },
    (request, reply) => {
      // Enforce signature verification if a secret was given.
      if (
        secret !== undefined &&
        request.headers['X-Hub-Signature'] === undefined
      ) {
        reply.code(401).send();
        return;
      }

      // Verify signature if included in the request by the hub.
      if (request.headers['X-Hub-Signature'] !== undefined) {
        const coercedSecret = maybeOf(secret)
          .toEither(
            'Received content is signed but no secret has been provided.',
          )
          .unsafeCoerce();

        const signatureIsCorrect = isSignatureCorrect(
          request.headers['X-Hub-Signature'],
          request.body,
          coercedSecret,
        );

        if (!signatureIsCorrect) {
          reply.code(200).send();
          return;
        }
      }

      onData(request.body);
      reply.code(200).send();
    },
  );

  return server;
};
