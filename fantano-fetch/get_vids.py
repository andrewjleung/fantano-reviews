import os
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
import json

scopes = ["https://www.googleapis.com/auth/youtube.readonly"]

# Disable OAuthlib's HTTPS verification when running locally.
# *DO NOT* leave this option enabled in production.
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

api_service_name = "youtube"
api_version = "v3"
client_secrets_file = "client_secret.json"
api_key = "AIzaSyDzzAIzkZlkyZqoJ3_BO4PdsS98pnU5irA"

theneedledrop_id = "UCt7fwAhXDy3oNFTAzF2o8Pw"
theneedledrop_uploads_playlist_id = "UUt7fwAhXDy3oNFTAzF2o8Pw"

youtube = googleapiclient.discovery.build(
    api_service_name, api_version, developerKey=api_key)

results = {}

request = youtube.playlistItems().list(
    part="contentDetails,snippet",
    playlistId=theneedledrop_uploads_playlist_id,
    maxResults=50
)
response = request.execute()


def get_all_playlist_videos(init, nextPageToken):
    items = init
    response = {"nextPageToken": nextPageToken}

    if nextPageToken is None:
        return init

    while("nextPageToken" in response):
        request = youtube.playlistItems().list(
            part="contentDetails,snippet",
            playlistId=theneedledrop_uploads_playlist_id,
            pageToken=response["nextPageToken"],
            maxResults=50
        )

        response = request.execute()

        items.append(response["items"])

    return items


items = get_all_playlist_videos(response["items"], response["nextPageToken"])

filename = "./bin/all_videos.json"
os.makedirs(os.path.dirname(filename), exist_ok=True)
with open(filename, "w") as f:
    f.write(json.dumps(items))
