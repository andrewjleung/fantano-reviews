import dotenv from 'dotenv';
import { Either, Right } from 'purify-ts';
import { bindFalsyToEither } from './purifyUtils';

dotenv.config();

export type Config = {
  channelId: string;
  playlistId: string;
  callbackUrl: string;
  videosFilename: string;
  reviewsFilename: string;
  ghPat: string;
  secret: string;
};

const getConfig = (): Either<string, Config> =>
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

export default getConfig;
