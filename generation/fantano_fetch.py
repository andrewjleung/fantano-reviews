'''
Script to fetch Anthony Fantano reviews.
'''
import argparse
import json
import csv
from cache import Cache
from video_fetcher import VideoFetcher
from review_parser import parse_reviews

DATA = './data'
VIDEOS_FILENAME = f'{DATA}/all_videos.json'
REVIEWS_FILENAME = f'{DATA}/reviews.csv'
YTV3_API_KEY_FILENAME = "./api_key.json"

API_SERVICE_NAME = "youtube"
API_VERSION = "v3"

THENEEDLEDROP_ID = "UCt7fwAhXDy3oNFTAzF2o8Pw"
THENEEDLEDROP_PLAYLIST_ID = "UUt7fwAhXDy3oNFTAzF2o8Pw"


def parse_args():
    """ Function:   parse_args
        Parameters: None
        Returns:    the parsed arguments
    """
    parser = argparse.ArgumentParser(
        description='Fetch theneedledrop reviews.')
    parser.add_argument('-f', '--fetch', action='store_true',
                        help='Fetch new data from the YouTube API, otherwise use a cached response')
    parser.add_argument('-d', '--debug', action='store_true',
                        help='Enable debug logging')
    return parser.parse_args()


def write_review_dataset_csv(videos, csv_filename, debug=True):
    """ Function:   write_review_dataset_csv
        Parameters: list of dict, data of all videos
                    csv_fliename, the file to write the CSV review data to
                    debug, whether to print status information
        Returns:    None
    """
    if debug:
        print("Creating review dataset from videos...")

    reviews = parse_reviews(videos)
    keys = reviews[0].keys()

    if debug:
        print(f"Outputting data to {csv_filename}")

    with open(csv_filename, 'w', encoding="utf-8") as out_file:
        dict_writer = csv.DictWriter(out_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(reviews)


if __name__ == "main":
    with open(YTV3_API_KEY_FILENAME, 'r', encoding="utf-8") as api_key_file:
        args = parse_args()
        api_key = json.load(api_key_file)
        fetcher = VideoFetcher(api_key, args.debug)

        cached_videos = Cache(VIDEOS_FILENAME, lambda: fetcher.fetch_all_playlist_videos(
            THENEEDLEDROP_PLAYLIST_ID), not args.fetch).get()

        write_review_dataset_csv(cached_videos, REVIEWS_FILENAME, args.debug)
