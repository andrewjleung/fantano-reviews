import { Static, Type } from '@sinclair/typebox';

export type Review = {
  artist: string;
  title: string;
  rating: number;
  genres: string[];
  publishedAt: string;
};

export type PubSubHubBubConfig = {
  topic: string;
  onData: (data: unknown) => void;
  secret?: string;
};

export const GetResponseQuery = Type.Object({
  'hub.mode': Type.Union([
    Type.Literal('denied'),
    Type.Literal('subscribe'),
    Type.Literal('unsubscribe'),
  ]),
  'hub.topic': Type.String(),
  'hub.reason': Type.Optional(Type.String()),
  'hub.challenge': Type.Optional(Type.String()),
  'hub.lease_seconds': Type.Optional(Type.Number()),
});

export type GetResponseQuery = Static<typeof GetResponseQuery>;

export const ContentDistributionRequestHeaders = Type.Object({
  'X-Hub-Signature': Type.Optional(Type.String()),
  'Content-Type': Type.Literal('application/atom+xml'),
  Link: Type.String(),
});

export type ContentDistributionRequestHeaders = Static<
  typeof ContentDistributionRequestHeaders
>;
