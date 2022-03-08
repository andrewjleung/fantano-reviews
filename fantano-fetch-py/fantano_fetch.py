'''
Script to fetch Anthony Fantano reviews.
'''
import argparse
from fetch_fantano_videos import fetch_and_write_videos
from review_processor import write_review_dataset_csv

BIN = './bin'
VIDEOS_FILENAME = f'{BIN}/all_videos.json'
REVIEWS_FILENAME = f'{BIN}/reviews.csv'

parser = argparse.ArgumentParser(
    description='Fetch Anthony Fantano (theneedledrop) reviews.')
parser.add_argument('-f', '--fetch', action='store_true',
                    help='specify whether to fetch from the YouTube API or use a cached response')
args = parser.parse_args()

if args.fetch:
    fetch_and_write_videos(VIDEOS_FILENAME)

write_review_dataset_csv(VIDEOS_FILENAME, REVIEWS_FILENAME)
