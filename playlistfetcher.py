"""
Script for fetching Anthony Fantano videof rom the YouTube API.
"""
from googleapiclient.discovery import build


API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
CLIENT_SECRETS_FILE = "client_secret.json"
MAX_PAGE_SIZE = 50


class PlaylistFetcher:
    """
    Class used to fetch videos in a YouTube playlist.
    """

    def __init__(self, api_key, playlist_id, debug=False):
        self.resource = build(
            API_SERVICE_NAME, API_VERSION, developerKey=api_key)
        self.playlist_id = playlist_id
        self.debug = debug

    def fetch_num_videos(self):
        """ Function:   fetch_num_videos
            Parameters: None
            Returns:    int, the number of videos in this playlist.
        """
        request = self.resource.playlists().list(
            part="contentDetails",
            id=self.playlist_id
        )
        response = request.execute()
        return response["items"][0]["contentDetails"]["itemCount"]

    def fetch_page(self, page_token=None):
        """ Function:   fetch_page
            Parameters: page_token, string if specifying a page to fetch, None
                        if fetching the first page
            Returns:    (items, next_page_token), the items in the page and a
                        next_page_token if there is one
        """
        request = self.resource.playlistItems().list(
            part="contentDetails,snippet",
            playlistId=self.playlist_id,
            pageToken=page_token,
            maxResults=MAX_PAGE_SIZE
        )
        response = request.execute()
        items = response["items"]
        return (items, response.get("nextPageToken", None))

    def fetch_all_videos(self):
        """ Function: fetch_all_videos
            Parameters: api_key, string, the YouTube API v3 key to use
                        debug, whether to print status information
            Returns: list of dict, list of metadata dictionaries for all videos
        """
        if self.debug:
            print("Fetching all theneedledrop videos...")

        num_videos = self.fetch_num_videos()

        # Request the first page.
        items, next_page_token = self.fetch_page()

        if self.debug:
            print(f"{len(items)}/{num_videos} videos fetched...", end='\r')

        # Request all subsequent pages and accumulate the results.
        while next_page_token is not None:
            new_items, next_page_token = self.fetch_page(next_page_token)
            items += new_items

            if self.debug:
                print(f"{len(items)}/{num_videos} videos fetched...",
                      end='\r')

        return items
