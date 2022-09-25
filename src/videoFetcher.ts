import { youtube_v3 } from 'googleapis';
import { Either, EitherAsync, List, Maybe, Right } from 'purify-ts';
import { maybeOf } from './purifyUtils';
import logUpdate from 'log-update';

const MAX_PAGE_SIZE = 50;

// TODO: Handle exceptions from awaited promises.

export const getNumPlaylistVideos =
  (service: youtube_v3.Youtube) =>
  async (playlistId: string): Promise<Either<Error, number>> => {
    const response = await service.playlists.list(
      {
        id: [playlistId],
        part: ['contentDetails'],
      },
      {},
    );

    return maybeOf(response.data.items)
      .chain(List.head)
      .chainNullable((value) => value.contentDetails?.itemCount)
      .toEither(
        Error(
          `Unable to retrieve number of playlist videos from playlist ${playlistId}`,
        ),
      );
  };

type PlaylistPageWithNextPageToken = {
  items: youtube_v3.Schema$PlaylistItem[];
  maybeNextPageToken: Maybe<string>;
};

const getPlaylistPage =
  (service: youtube_v3.Youtube) =>
  async (
    playlistId: string,
    pageToken?: string,
  ): Promise<Either<Error, PlaylistPageWithNextPageToken>> => {
    const response = await service.playlistItems.list(
      {
        playlistId,
        pageToken,
        maxResults: MAX_PAGE_SIZE,
        part: ['contentDetails', 'snippet'],
      },
      {},
    );

    return maybeOf(response.data.items)
      .map((items) => ({
        items,
        maybeNextPageToken: maybeOf(response.data.nextPageToken),
      }))
      .toEither(
        Error(
          pageToken === undefined
            ? `Unable to fetch first page from playlist ${playlistId}`
            : `Unable to fetch page ${pageToken} from playlist ${playlistId}`,
        ),
      );
  };

export const getAllPlaylistVideos =
  (service: youtube_v3.Youtube) =>
  async (
    playlistId: string,
  ): Promise<Either<Error, youtube_v3.Schema$PlaylistItem[]>> => {
    // TODO: Right now logging is always on. It should be configurable.
    console.log('Fetching all theneedledrop videos...');

    const numVideos = (
      await getNumPlaylistVideos(service)(playlistId)
    ).orDefault(0);

    const logProgress = (acc: youtube_v3.Schema$PlaylistItem[]): void =>
      logUpdate(`${acc.length}/${numVideos} videos fetched...`);

    // Recursively fetch pages of playlist videos until there is no longer a
    // next page. That is indicated by there being no `nextPageToken` in a
    // response. Accumulator-based recursion is used here in order to enable a
    // better logging experience of the progress of fetching videos.
    const getNextPageRec = async (
      playlistId: string,
      acc: youtube_v3.Schema$PlaylistItem[],
      pageToken?: string,
    ): Promise<Either<Error, youtube_v3.Schema$PlaylistItem[]>> => {
      const eitherPageOrError = EitherAsync.fromPromise(() =>
        getPlaylistPage(service)(playlistId, pageToken),
      );

      return eitherPageOrError.chain((pageAndMaybeNextPageToken) => {
        const newAcc = acc.concat(pageAndMaybeNextPageToken.items);
        logProgress(newAcc);

        return pageAndMaybeNextPageToken.maybeNextPageToken.caseOf({
          Just: (nextPageToken) =>
            EitherAsync.fromPromise(() =>
              getNextPageRec(playlistId, newAcc, nextPageToken),
            ),
          Nothing: () => EitherAsync.liftEither(Right(newAcc)),
        });
      });
    };

    return getNextPageRec(playlistId, []);
  };

export const getVideo =
  (service: youtube_v3.Youtube) =>
  async (
    playlistId: string,
    videoId: string,
  ): Promise<Either<Error, youtube_v3.Schema$PlaylistItem>> => {
    const response = await service.playlistItems.list({
      part: ['contentDetails', 'snippet'],
      playlistId,
      videoId,
    });

    return maybeOf(response.data.items)
      .chain(List.head)
      .toEither(
        Error(`Unable to fetch video ${videoId} from playlist ${playlistId}.`),
      );
  };
