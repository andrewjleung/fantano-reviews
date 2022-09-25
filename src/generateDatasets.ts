import dotenv from 'dotenv';
import { Either, EitherAsync, Right } from 'purify-ts';
import { getAPIKey, getService } from './auth';
import { generateDatasets } from './datasetGenerator';
import { bindFalsyToEither } from './purifyUtils';

dotenv.config();

const getFilenames = (): Either<
  Error,
  { videosFilename: string; reviewsFilename: string }
> =>
  Right({})
    .chain(
      bindFalsyToEither(
        'videosFilename',
        process.env.VIDEOS_FILENAME,
        Error('Missing env variable "VIDEOS_FILENAME".'),
      ),
    )
    .chain(
      bindFalsyToEither(
        'reviewsFilename',
        process.env.REVIEWS_FILENAME,
        Error('Missing env variable "REVIEWS_FILENAME"'),
      ),
    );

EitherAsync.liftEither(getFilenames())
  .chain(({ videosFilename, reviewsFilename }) =>
    EitherAsync.liftEither(getAPIKey())
      .map(getService)
      .chain((service) =>
        generateDatasets(service, videosFilename, reviewsFilename),
      ),
  )
  .run()
  .then((eitherNothingOrError) =>
    eitherNothingOrError.caseOf({
      Left: (error) => {
        throw error;
      },
      Right: () => {},
    }),
  );
