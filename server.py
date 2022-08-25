import csv
from datetime import datetime
import json
from subprocess import (run, CalledProcessError)
from videofetcher import VideoFetcher
from reviewparser import (parse_review, is_review)
import xmltodict
from flask import Flask

DATA = './data'
VIDEOS_FILENAME = f'{DATA}/all_videos.json'
REVIEWS_FILENAME = f'{DATA}/reviews.csv'
YTV3_API_KEY_FILENAME = "./api_key.json"

app = Flask(__name__)


def get_commit_msg(video_id):
    """
    Create the automated commit message for adding a review to the dataset with
    the following video ID.
    """
    timestamp = datetime.now().strftime("%m-%d-%Y %H:%M:%S")
    return f'{timestamp} - Add review for video "{video_id}"'


def get_commit_body(video_id, review):
    """
    Create the automate commit body for adding the given review to the dataset.
    """
    return f"""
https://www.youtube.com/watch?v={video_id}
{review["artist"]} - {review["title"]}
Rating: {review["rating"]}
Genres: {review["genres"]}
"""


def commit_changes(video_id, review):
    """
    Commit the current state of the review dataset.
    """
    run(['git', 'add', './data/reviews.csv'], check=True)
    run(['git', 'commit', '-m',
        f"{get_commit_msg(video_id)}\n{get_commit_body(video_id, review)}"], check=True)
    run(['git', 'push'], check=True)


@app.route("/callback", methods=['POST'])
def callback_post():
    """
    Handle the `/callback` POST endpoint.
    """
    if request.content_type != "application/atom+xml":
        return "Bad Request", 400

    data = xmltodict.parse(request.data)

    try:
        with open(YTV3_API_KEY_FILENAME, 'r', encoding="utf-8") as api_key_file:
            api_key = json.load(api_key_file)
            data = xmltodict.parse(request.data)
            video_id = data["feed"]["entry"]["yt:videoId"]
            video = VideoFetcher(api_key).fetch_video(video_id)

            if not is_review(video):
                # TODO: Add debug logging.
                return None

            review = parse_review(video)

            with open(REVIEWS_FILENAME, 'a', encoding="utf-8") as out_file:
                dict_writer = csv.DictWriter(out_file, review.keys())
                dict_writer.writerow(review)

            commit_changes(video_id, review)

        return review
    except KeyError:
        print(
            f"Failed to get video ID from notification: {request.data}")
    except CalledProcessError:
        print(
            f"Failed to commit new review dataset after review: {review}")
    except Exception:
        print(f"Failed to process video: {request.data}")


@app.route("/callback", methods=["GET"])
def callback_get():
    """
    Handle the `/callback GET endpoint.
    """
    if "hub.challenge" not in request.args:
        return "Bad Request", 400

    return request.args["hub.challenge"]


app.run('0.0.0.0')
