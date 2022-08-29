"""
Script to update the review dataset with a single new review.
"""
import csv
import json
import sys
from collections import deque
from video_fetcher import VideoFetcher
from review_parser import (is_review, parse_review)

VIDEOS_FILENAME = '../tnd-reviews/all_videos.json'
REVIEWS_FILENAME = '../tnd-reviews/reviews.csv'
YTV3_API_KEY_FILENAME = "../api_key.json"
THENEEDLEDROP_PLAYLIST_ID = "UUt7fwAhXDy3oNFTAzF2o8Pw"
NOT_REVIEW_ERR_CODE = 8

with open(YTV3_API_KEY_FILENAME, 'r', encoding="utf-8") as api_key_file:
    api_key = json.load(api_key_file)
    video_id = sys.argv[1]
    fetcher = VideoFetcher(api_key)

    video = fetcher.fetch_video(THENEEDLEDROP_PLAYLIST_ID, video_id)

    videos = []
    with open(VIDEOS_FILENAME, 'r', encoding="utf-8") as videos_file:
        videos = deque(json.load(videos_file))
        videos.appendleft(video)

    with open(VIDEOS_FILENAME, 'w+', encoding="utf-8") as videos_file:
        videos_file.write(json.dumps(list(videos)))

    if not is_review(video):
        sys.exit(NOT_REVIEW_ERR_CODE)

    review = parse_review(video)

    with open(REVIEWS_FILENAME, 'a', encoding="utf-8") as out_file:
        dict_writer = csv.DictWriter(out_file, review.keys())
        dict_writer.writerow(review)
