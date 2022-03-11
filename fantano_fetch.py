'''
Script to fetch Anthony Fantano reviews.
'''
import argparse
import json
from fetch_fantano_videos import fetch_and_write_videos
from review_processor import write_review_dataset_csv

DATA = './data'
VIDEOS_FILENAME = f'{DATA}/all_videos.json'
REVIEWS_FILENAME = f'{DATA}/reviews.csv'
YTV3_API_KEY_FILENAME = "./api_key.json"

with open(YTV3_API_KEY_FILENAME, 'r', encoding="utf-8") as api_key_file:
    api_key = json.load(api_key_file)

    parser = argparse.ArgumentParser(
        description='Fetch Anthony Fantano (theneedledrop) reviews.')
    parser.add_argument('-f', '--fetch', action='store_true',
                        help='fetch new data from the YouTube API, otherwise use a cached response')
    # TODO: add ability to specify API key directory
    args = parser.parse_args()

    if args.fetch:
        fetch_and_write_videos(VIDEOS_FILENAME, api_key)

    write_review_dataset_csv(VIDEOS_FILENAME, REVIEWS_FILENAME)
