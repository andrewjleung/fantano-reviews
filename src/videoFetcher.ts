import { youtube_v3 } from 'googleapis';
import { Just, List, Maybe, MaybeAsync } from 'purify-ts';
import { maybeOf } from './purifyUtils';

const MAX_PAGE_SIZE = 50;

export const getNumPlaylistVideos =
  (service: youtube_v3.Youtube) =>
  async (playlistId: string): Promise<Maybe<number>> => {
    const response = await service.playlists.list(
      {
        id: [playlistId],
        part: ['contentDetails'],
      },
      {},
    );

    return maybeOf(response.data.items)
      .chain(List.head)
      .chainNullable((value) => value.contentDetails?.itemCount);
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
  ): Promise<Maybe<PlaylistPageWithNextPageToken>> => {
    const response = await service.playlistItems.list(
      {
        playlistId,
        pageToken,
        maxResults: MAX_PAGE_SIZE,
      },
      {},
    );

    return maybeOf(response.data.items).map((items) => ({
      items,
      maybeNextPageToken: maybeOf(response.data.nextPageToken),
    }));
  };

export const getAllPlaylistVideos =
  (service: youtube_v3.Youtube) =>
  async (
    playlistId: string,
  ): Promise<Maybe<youtube_v3.Schema$PlaylistItem[]>> => {
    const recursive = async (
      playlistId: string,
      pageToken?: string,
    ): Promise<Maybe<youtube_v3.Schema$PlaylistItem[]>> =>
      MaybeAsync.fromPromise(() =>
        getPlaylistPage(service)(playlistId, pageToken),
      ).chain((pageAndMaybeNextPageToken) =>
        pageAndMaybeNextPageToken.maybeNextPageToken.caseOf({
          Just: (nextPageToken) =>
            MaybeAsync.fromPromise(() =>
              recursive(playlistId, nextPageToken).then((maybeNextPageItems) =>
                maybeNextPageItems.map((nextPageItems) =>
                  pageAndMaybeNextPageToken.items.concat(nextPageItems),
                ),
              ),
            ),
          Nothing: () =>
            MaybeAsync.liftMaybe(Just(pageAndMaybeNextPageToken.items)),
        }),
      );

    return recursive(playlistId);
  };

export const fetchVideo =
  (service: youtube_v3.Youtube) =>
  async (
    playlistId: string,
    videoId: string,
  ): Promise<Maybe<youtube_v3.Schema$PlaylistItem>> => {
    const response = await service.playlistItems.list({
      part: ['contentDetails', 'snippet'],
      playlistId,
      videoId,
    });

    return maybeOf(response.data.items).chain(List.head);
  };
