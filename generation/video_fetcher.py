"""
Script for fetching Anthony Fantano videof rom the YouTube API.
"""
from googleapiclient.discovery import build


API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
MAX_PAGE_SIZE = 50


class VideoFetcher:
    """
    Class used to fetch YouTube videos from the YouTube Data API.
    """

    def __init__(self, api_key, debug=False):
        self.resource = build(
            API_SERVICE_NAME, API_VERSION, developerKey=api_key)
        self.debug = debug

    def fetch_num_playlist_videos(self, playlist_id):
        """ Function:   fetch_num_playlist_videos
            Parameters: playlist_id, the ID of the playlist to fetch from
            Returns:    int, the number of videos in this playlist.
        """
        request = self.resource.playlists().list(
            part="contentDetails",
            id=playlist_id
        )
        response = request.execute()
        return response["items"][0]["contentDetails"]["itemCount"]

    def fetch_playlist_page(self, playlist_id, page_token=None):
        """ Function:   fetch_playlist_page
            Parameters: playlist_id, the ID of the playlist to fetch from
                        page_token, string if specifying a page to fetch, None
                            if fetching the first page
            Returns:    (items, next_page_token), the items in the page and a
                        next_page_token if there is one
        """
        request = self.resource.playlistItems().list(
            part="contentDetails,snippet",
            playlistId=playlist_id,
            pageToken=page_token,
            maxResults=MAX_PAGE_SIZE
        )
        response = request.execute()
        items = response["items"]
        return (items, response.get("nextPageToken", None))

    def fetch_all_playlist_videos(self, playlist_id):
        """ Function:   fetch_all_playlist_videos
            Parameters: api_key, string, the YouTube API v3 key to use
                        playlist_id, the ID of the playlist to fetch from
            Returns: list of dict, list of metadata dictionaries for all videos
        """
        if self.debug:
            print("Fetching all theneedledrop videos...")

        num_videos = self.fetch_num_playlist_videos(playlist_id)

        # Request the first page.
        items, next_page_token = self.fetch_playlist_page(playlist_id)

        if self.debug:
            print(f"{len(items)}/{num_videos} videos fetched...", end='\r')

        # Request all subsequent pages and accumulate the results.
        while next_page_token is not None:
            new_items, next_page_token = self.fetch_playlist_page(playlist_id,
                                                                  next_page_token)
            items += new_items

            if self.debug:
                print(f"{len(items)}/{num_videos} videos fetched...",
                      end='\r')

        return items

    def fetch_video(self, playlist_id, video_id):
        """ Function:   fetch_video
            Parameters: playlistId, the ID of the channel's general playlist
                        videoId, the ID of the video
            Returns:    dict, video metadata
        """
        request = self.resource.playlistItems().list(
            part="contentDetails,snippet",
            playlistId=playlist_id,
            videoId=video_id
        )
        response = request.execute()

        if len(response["items"]) < 1:
            return None

        return response["items"][0]
