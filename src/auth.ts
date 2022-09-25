import { Either, Maybe } from 'purify-ts';
import { google, youtube_v3 } from 'googleapis';

export const getAPIKey = (): Either<Error, string> =>
  Maybe.fromFalsy(process.env.YTV3_API_KEY).toEither(
    Error('No API key supplied for the YouTube V3 API.'),
  );

export const getService = (apiKey: string): youtube_v3.Youtube => {
  const googleAuth = new google.auth.GoogleAuth();
  const jwt = googleAuth.fromAPIKey(apiKey);

  return new youtube_v3.Youtube({
    auth: jwt,
  });
};
