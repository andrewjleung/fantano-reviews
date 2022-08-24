from flask import Flask, request
import csv
import xmltodict
import json
from videofetcher import VideoFetcher
from reviewparser import parse_review

DATA = './data'
VIDEOS_FILENAME = f'{DATA}/all_videos.json'
REVIEWS_FILENAME = f'{DATA}/reviews.csv'
YTV3_API_KEY_FILENAME = "./api_key.json"

app = Flask(__name__)


@app.route("/callback", methods=['POST', 'GET'])
def callback():
    """
    Handle the `/callback` endpoint.
    """
    if request.method == 'POST':
        try:
            with open(YTV3_API_KEY_FILENAME, 'r', encoding="utf-8") as api_key_file:
                api_key = json.load(api_key_file)
                data = xmltodict.parse(request.data)
                video_id = data["feed"]["entry"]["yt:videoId"]
                video = VideoFetcher(api_key).fetch_video(video_id)
                review = parse_review(video)

                print(review)

                with open(REVIEWS_FILENAME, 'a', encoding="utf-8") as out_file:
                    dict_writer = csv.DictWriter(out_file, review.keys())
                    dict_writer.writerow(review)

            return review
        except KeyError:
            print(f"Failed to get video ID from notification: {request.data}")
        except Exception:
            print(f"Failed to process video.")

    return request.args.get('hub.challenge')


app.run('0.0.0.0')
