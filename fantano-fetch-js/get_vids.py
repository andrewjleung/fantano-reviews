import os
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
import json

OUTTEXT = True
OUTPUT_FILE = "./bin/all_videos.json"

scopes = ["https://www.googleapis.com/auth/youtube.readonly"]

# Disable OAuthlib's HTTPS verification when running locally.
# *DO NOT* leave this option enabled in production.
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

api_service_name = "youtube"
api_version = "v3"
client_secrets_file = "client_secret.json"
api_key_filename = "./apikey.json"

api_key_file = open(api_key_filename, 'r', encoding="utf-8")
api_key = json.load(api_key_file)

theneedledrop_id = "UCt7fwAhXDy3oNFTAzF2o8Pw"
theneedledrop_uploads_playlist_id = "UUt7fwAhXDy3oNFTAzF2o8Pw"

youtube = googleapiclient.discovery.build(
    api_service_name, api_version, developerKey=api_key)


def get_all_playlist_videos():
    if OUTTEXT:
        print("Fetching all Fantano videos...")

    # First page request.
    request = youtube.playlistItems().list(
        part="contentDetails,snippet",
        playlistId=theneedledrop_uploads_playlist_id,
        maxResults=50
    )
    response = request.execute()
    items = response["items"]

    # Request all subsequent pages and accumulate the results.
    while("nextPageToken" in response):
        request = youtube.playlistItems().list(
            part="contentDetails,snippet",
            playlistId=theneedledrop_uploads_playlist_id,
            pageToken=response["nextPageToken"],
            maxResults=50
        )

        response = request.execute()
        items = items + response["items"]

    return items


# Get all videos.
items = get_all_playlist_videos()

if OUTTEXT:
    print(f"{len(items)} videos fetched.")
    print(f"Outputting data to {OUTPUT_FILE}")

# Write the result to an output file.
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w") as f:
    f.write(json.dumps(items))
