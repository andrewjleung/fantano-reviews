'''
Script to fetch Anthony Fantano reviews.
'''
import argparse
import json
import os
import csv
from videofetcher import VideoFetcher
from reviewparser import parse_reviews

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


def fetch_and_write_videos(videos_filename, playlist_fetcher, debug=False):
    """ Function: fetch_and_write_videos
        Parameters: videos_filename, the file to output video metadata to
                    playlist_fetcher, VideoFetcher used to fetch videos
                    debug, whether to print debug information
        Returns: None
    """
    # Get all videos.
    items = playlist_fetcher.fetch_all_playlist_videos(
        THENEEDLEDROP_PLAYLIST_ID)

    if debug:
        print(f"{len(items)} videos fetched from YouTube API.")
        print(f"\nOutputting data to {videos_filename}\n")

    # Write the result to an output file.
    os.makedirs(os.path.dirname(videos_filename), exist_ok=True)
    with open(videos_filename, "w", encoding="utf-8") as outfile:
        outfile.write(json.dumps(items))


def write_review_dataset_csv(videos_filename, csv_filename, debug=True):
    """ Function:   write_review_dataset_csv
        Parameters: videos_filename, the file containing JSON data of all videos
                    csv_fliename, the file to write the CSV review data to
                    debug, whether to print status information
        Returns:    None
    """
    if debug:
        print("Creating review dataset from videos...")

    with open(videos_filename, 'r', encoding="utf-8") as vid_file:
        videos = json.load(vid_file)
        reviews = parse_reviews(videos)
        keys = reviews[0].keys()

        if debug:
            print(f"Outputting data to {csv_filename}")

        with open(csv_filename, 'w', encoding="utf-8") as out_file:
            dict_writer = csv.DictWriter(out_file, keys)
            dict_writer.writeheader()
            dict_writer.writerows(reviews)


with open(YTV3_API_KEY_FILENAME, 'r', encoding="utf-8") as api_key_file:
    args = parse_args()
    api_key = json.load(api_key_file)
    fetcher = VideoFetcher(api_key, args.debug)

    if args.fetch:
        fetch_and_write_videos(VIDEOS_FILENAME, fetcher, args.debug)

    write_review_dataset_csv(VIDEOS_FILENAME, REVIEWS_FILENAME, args.debug)
