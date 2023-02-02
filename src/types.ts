import { Static, Type } from '@sinclair/typebox';

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

export type Video = {
  title: string;
  description: string;
  publishedAt: string;
};

export type ReviewRowRating =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 'NOT GOOD'
  | 'NOT BAD'
  | 'CLASSIC';

type UnratedReview = {
  artist: string;
  title: string;
  publishedAt: string;
  genres: string[];
};

export type ClassicReview = {
  type: 'classic';
} & UnratedReview;

export type NotGoodReview = {
  type: 'not-good' | 'not-bad';
} & UnratedReview;

export type StandardReview = {
  type: 'standard';
  rating: ReviewRowRating;
} & UnratedReview;

// TODO: Tens reviews are on Fantano's second channel. Fetch data from there and
// parse it too.
export type TensReview = {
  type: 'tens';
  albums: { artist: string; title: string }[];
  publishedAt: string;
};

// TODO: Support REDUX REVIEWs.
// TODO: Add metadata for albums featured in greatest/worst lists.
// TODO: Support multi-reviews (videos containing multiple individual reviews).

export type Review =
  | StandardReview
  | ClassicReview
  | NotGoodReview
  | TensReview;

export type ReviewRow = {
  artist: string;
  title: string;
  rating: ReviewRowRating;
  genres: string[];
  publishedAt: string;
};
