'''
Script for fetching Anthony Fantano videof rom the YouTube API.
'''
import os
import json
from googleapiclient.discovery import build

API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
CLIENT_SECRETS_FILE = "client_secret.json"

THENEEDLEDROP_ID = "UCt7fwAhXDy3oNFTAzF2o8Pw"
THENEEDLEDROP_PLAYLIST_ID = "UUt7fwAhXDy3oNFTAzF2o8Pw"


def fetch_all_playlist_videos(api_key, outtext=True):
    ''' Function:   fetch_all_playlist_videos
        Parameters: api_key, string, the YouTube API v3 key to use
                    outtext, whether to print status information
        Returns:    list of dict, list of metadata dictionaries for all videos
    '''
    youtube = build(
        API_SERVICE_NAME, API_VERSION, developerKey=api_key)

    if outtext:
        print("Fetching all theneedledrop videos...")

    # Get the number of videos.
    request = youtube.playlists().list(
        part="contentDetails",
        id=THENEEDLEDROP_PLAYLIST_ID
    )
    response = request.execute()
    num_videos = response["items"][0]["contentDetails"]["itemCount"]

    # First page request.
    request = youtube.playlistItems().list(
        part="contentDetails,snippet",
        playlistId=THENEEDLEDROP_PLAYLIST_ID,
        maxResults=50
    )
    response = request.execute()
    items = response["items"]

    if outtext:
        print(f"{len(items)}/{num_videos} videos fetched...", end='\r')

    # Request all subsequent pages and accumulate the results.
    while("nextPageToken" in response):
        request = youtube.playlistItems().list(
            part="contentDetails,snippet",
            playlistId=THENEEDLEDROP_PLAYLIST_ID,
            pageToken=response["nextPageToken"],
            maxResults=50
        )

        response = request.execute()
        items = items + response["items"]

        if outtext:
            print(f"{len(items)}/{num_videos} videos fetched...",
                  end='\r')

    return items


def fetch_and_write_videos(output_file, api_key, outtext=True):
    ''' Function:   fetch_and_write_videos
        Parameters: output_file, the file to output video metadata to
                    api_key, string, the YouTube API v3 API key to use
                    outtext, whether to print status information
        Returns:    None
    '''
    # Get all videos.
    items = fetch_all_playlist_videos(api_key)

    if outtext:
        print(f"{len(items)} videos fetched from YouTube API.")
        print(f"\nOutputting data to {output_file}\n")

    # Write the result to an output file.
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as outfile:
        outfile.write(json.dumps(items))
