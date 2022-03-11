'''
Module for processing Anthony Fantano video metadata into a CSV of reviews.
'''
import re
import json
from datetime import datetime
import csv

ISO8601_FORMAT = "%Y-%m-%dT%H:%M:%S%z"

# This album has two "reviews" with the same title but different ratings.
# This processor chooses to ignore it.
APRIL_FOOLS_REVIEW = "PLANNINGTOROCK - All Love's Legal ALBUM REVIEW"

# Types of reviews specified within the titles of videos.
# After the review for Flying Lotus' Cosmogramma, review videos started being formatted with new
# review types.
NEW_REVIEW_TYPES = ["ALBUM", "MIXTAPE", "EP"]
OLD_REVIEW_TYPES = ["Album", "Review"]

# Regex to match reviews that came before "Flying Lotus- Cosmogramma ALBUM REVIEW".
PRE_COSMOGRAMMA_REVIEW_REGEX = re.compile(r'.+\- [^\"]+ Review.*')
FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE = datetime.strptime(
    "2010-05-05T18:34:43Z", ISO8601_FORMAT)

# Regex to match the rating of a review within its description.
RATING_REGEX = re.compile(r'([0-9]|10)\/10(?!,)')

# Regex to match the artist and album title of a review within its title.
# This matches against both old and new title formatting but doesn't catch some edge cases.
ARTIST_TITLE_REGEX = re.compile(
    fr'(?:(.+)- (.+?(?= {"| ".join(NEW_REVIEW_TYPES)})))|(?:(.+)(?:-s+|: )(.+?(?= {"| ".join(NEW_REVIEW_TYPES)})))|(?:(.+)- (.+?(?= {"| ".join(OLD_REVIEW_TYPES)})))')

# Review video titles that don't fit standard formatting.
EDGE_CASES = {
    "An Evening with Silk Sonic ALBUM REVIEW": {
        "artist": "Silk Sonic",
        "title": "An Evening with Silk Sonic",
    },
    "Belle and Sebastian Write About Love ALBUM REVIEW": {
        "artist": "Belle and Sebastian",
        "title": "Belle and Sebastian Write About Love",
    },
    "Master Musicians of Bukkake-Totem 3 ALBUM REVIEW": {
        "artist": "Master Musicians of Bukkake",
        "title": "Totem 3",
    },
    "CX KiDTRONiK: KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF ALBUM REVIEW": {
        "artist": "CX KiDTRONiK",
        "title": "KRAK ATTACK 2: THE BALLAD OF ELLI SKIFF",
    },
}

# Regex to match a genre string alongside the artist's label in a review's description.
GENRES_WITH_LABEL_REGEX = re.compile(r'(?: [1-2][09][0-2][0-9]) (\/.*)')

# Regex to match the genre string with a review's description.
GENRE_REGEX = re.compile(r'(?:\/ ([^\/]+))$')


# Labels that erroneously get recognized as genres since some reviews aren't tagged with genres.
# This is by no means comprehensive, there may still be some labels that don't get filtered out.
# The only downside here is that some reviews may have genres that aren't actually genres.
LABELS = ["RECORDS", "FORTUNA", "DEAD OCEANS", "PLUDERPHONICS"]


def is_review(video):
    ''' Function: _is_review
        Parameters: video, dictionary containing info on a single video
        Returns:    bool, whether the given video is a review
    '''
    snippet = video["snippet"]
    title = snippet["title"]
    published_at = snippet["publishedAt"]
    description = snippet["description"]

    # This album has two "reviews" with the same title but different ratings.
    # This processor chooses to ignore it.
    if title == APRIL_FOOLS_REVIEW:
        # Explicitly return False to halt control flow.
        return False

    published_at = datetime.strptime(published_at, ISO8601_FORMAT)
    has_rating = RATING_REGEX.search(description) is not None

    # Reviews published from this review and onward have a different format to their title.
    if published_at >= FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE:
        is_valid_review = any(
            f"{review_type} REVIEW" in title for review_type in NEW_REVIEW_TYPES)

        return is_valid_review and has_rating

    # Check for the old review format.
    is_valid_review = bool(PRE_COSMOGRAMMA_REVIEW_REGEX.match(title))
    return is_valid_review and has_rating


def get_rating(description):
    ''' Function:   _get_rating
        Parameters: description, the review video's description
        Returns:    int, the parsed rating or None if not present
    '''
    try:
        return int(RATING_REGEX.findall(description)[0])
    except (IndexError, ValueError):
        # Either there is no rating, or it was unable to be parsed into an int.
        return None


def get_genres(description):
    ''' Function:   _get_genres
        Parameters: description, the review video's description
        Returns:    string, the genres within the given description, delimited by semicolons and
                    ready to be placed in a CSV, None if there's no genres
    '''
    def is_genre(genre):
        return (len(genre) > 0) and (not any(
            label in genre for label in LABELS))

    def clean_genre(genre):
        return genre.strip().lower()

    try:
        genres_with_label = GENRES_WITH_LABEL_REGEX.findall(description)[0]
        genres_str = GENRE_REGEX.findall(genres_with_label)[0]
        genres_lst = [clean_genre(genre)
                      for genre in genres_str.split(", ") if is_genre(genre)]

        genres = ";".join(genres_lst)
        return genres

    except (ValueError, IndexError):
        return None


def get_artist_and_title(video_title):
    ''' Function:   _get_artist_and_title
        Parameters: string, the title of the video to analyze
        Returns:    tuple (string, string), (the artist, the title)
    '''
    if video_title in EDGE_CASES:
        return (
            EDGE_CASES[video_title]["artist"],
            EDGE_CASES[video_title]["title"]
        )

    match = ARTIST_TITLE_REGEX.findall(video_title)
    match = list(sum(match, ()))
    match = list(filter(lambda m: m != "", match))
    artist = match[0].strip()
    title = match[1].strip()

    return (artist, title)


def clean_video(video):
    ''' Function:   _clean_video
        Parameters: video, dict containing video metadata
        Returns:    dict, a cleaned, flattened dict of review metadata
    '''
    snippet = video["snippet"]
    title = snippet["title"]
    description = snippet["description"]

    # Filter out unnecessary keys.
    keep = ["publishedAt", "title"]
    filtered_snippet = {k: v
                        for k, v in snippet.items() if k in keep}

    # Enrich with parsed artist, title, genre, and rating information.
    (artist, title) = get_artist_and_title(title)
    filtered_snippet["artist"] = artist
    filtered_snippet["title"] = title
    filtered_snippet["rating"] = get_rating(description)
    filtered_snippet["genres"] = get_genres(description)

    return filtered_snippet


def get_review_dataset(videos_filename):
    ''' Function:   get_review_dataset
        Parameters: videos_filename, the file containing JSON data of all videos
        Returns:    list of dict, a list of review metadata dictionaries
    '''
    with open(videos_filename, 'r', encoding="utf-8") as vid_file:
        videos = json.load(vid_file)
        reviews = sorted([clean_video(video) for video in videos if is_review(video)],
                         key=lambda r: datetime.strptime(
                             r["publishedAt"], ISO8601_FORMAT),
                         reverse=True)

        return reviews


def write_review_dataset_csv(videos_filename, csv_filename, outtext=True):
    ''' Function:   write_review_dataset_csv
        Parameters: videos_filename, the file containing JSON data of all videos
                    csv_fliename, the file to write the CSV review data to
                    outtext, whether to print status information
        Returns:    None
    '''
    if outtext:
        print("Creating review dataset from videos...")

    reviews = get_review_dataset(videos_filename)
    keys = reviews[0].keys()

    if outtext:
        print(f"Outputting data to {csv_filename}")

    with open(csv_filename, 'w', encoding="utf-8") as out_file:
        dict_writer = csv.DictWriter(out_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(reviews)
