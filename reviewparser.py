"""
Module for processing Anthony Fantano video metadata into a CSV of reviews.
"""
import re
from datetime import datetime

ISO8601_FORMAT = "%Y-%m-%dT%H:%M:%S%z"

# This album has two "reviews" with the same title but different ratings.
# This processor chooses to ignore it.
APRIL_FOOLS_REVIEW = "PLANNINGTOROCK - All Love's Legal ALBUM REVIEW"
IGNORED_REVIEWS = [APRIL_FOOLS_REVIEW]

# Types of reviews specified within the titles of videos.
# After the review for Flying Lotus' Cosmogramma, review videos started being
# formatted with new review types.

# A "new" review roughly follows the format:
# "<artist> - <title> <TYPE> REVIEW".
NEW_REVIEW_TYPES = ["ALBUM", "MIXTAPE", "EP"]

# An "old" review roughly follows the format:
# "<artist>- <title> Review"
OLD_REVIEW_TYPES = ["Album", "Review"]

# Regex to match reviews before "Flying Lotus- Cosmogramma ALBUM REVIEW".
PRE_COSMOGRAMMA_REVIEW_REGEX = re.compile(r'.+\- [^\"]+ Review.*')
FLYING_LOTUS_COSMOGRAMMA_REVIEW_DATE = datetime.strptime(
    "2010-05-05T18:34:43Z", ISO8601_FORMAT)

# Regex to match the rating of a review within its description.
RATING_REGEX = re.compile(r'([0-9]|10)\/10(?!,)')

# Regex to match the artist and album title of a review within its title.
# This matches against both old and new title formatting but doesn't catch some
# edge cases.
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

# Regex to match the genre and the artist's label in a review's description.
GENRES_WITH_LABEL_REGEX = re.compile(r'(?: [1-2][09][0-2][0-9]) (\/.*)')

# Regex to match the genre string with a review's description.
GENRE_REGEX = re.compile(r'(?:\/ ([^\/]+))$')

# Labels and genres in the descriptions of reviews are mixed together in a
# string of capitalized, slash-separated words. Genres are always comma
# delimited if there are multiple and usually come after the label in this
# sequence, but there are edge cases where either this ordering isn't followed
# or there are no genres, in which case it is difficult to recognize the
# distinction.
#
# These are labels that erroneously get recognized as genres since some reviews
# aren't tagged with genres. This is by no means comprehensive, there may still
# be some labels that don't get filtered out. The only downside here is that
# some reviews may have genres that aren't actually genres.
LABELS = ["RECORDS", "FORTUNA", "DEAD OCEANS", "PLUDERPHONICS"]


def is_new_review(title):
    """ Function:   is_new_review
        Parameters: title, string title of the review
        Returns:    bool, whether the given title matches a "new" review.
    """
    return any(
        f"{review_type} REVIEW" in title for review_type in NEW_REVIEW_TYPES)


def is_old_review(title):
    """ Function:   is_old_review
        Parameters: title, string title of the review
        Returns:    bool, whether the given title matches an "old" review.
    """
    return bool(PRE_COSMOGRAMMA_REVIEW_REGEX.match(title))


def is_review(video):
    """ Function:   is_review
        Parameters: video, dictionary containing info on a single video
        Returns:    bool, whether the given video is a review
    """
    snippet = video["snippet"]
    title = snippet["title"]
    published_at = snippet["publishedAt"]
    description = snippet["description"]

    if title in IGNORED_REVIEWS:
        return False

    published_at = datetime.strptime(published_at, ISO8601_FORMAT)
    has_rating = RATING_REGEX.search(description) is not None

    is_valid_review = is_new_review(title) or is_old_review(title)
    return is_valid_review and has_rating


def get_rating(description):
    """ Function:   get_rating
        Parameters: description, the review video's description
        Returns:    int, the parsed rating or None if not present
    """
    try:
        return int(RATING_REGEX.findall(description)[0])
    except (IndexError, ValueError):
        # Either there is no rating, or it was unable to be parsed into an int.
        return None


def get_genres(description):
    """ Function:   get_genres
        Parameters: description, the review video's description
        Returns:    string, the genres within the given description, delimited 
                    by semicolons and ready to be placed in a CSV, None if 
                    there are no genres
    """
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

        return ";".join(genres_lst)
    except (ValueError, IndexError):
        return None


def get_artist_and_title(video_title):
    """ Function:   get_artist_and_title
        Parameters: string, the title of the video to analyze
        Returns:    tuple (string, string), (the artist, the title)
    """
    if video_title in EDGE_CASES:
        return (
            EDGE_CASES[video_title]["artist"],
            EDGE_CASES[video_title]["title"]
        )

    match = ARTIST_TITLE_REGEX.findall(video_title)

    # The artist/title regex yields tuples representing each matched capture
    # group. This will flatten all the tuples into a single tuple and convert
    # that to a list.
    match = list(sum(match, ()))

    match = list(filter(lambda m: len(m) > 0, match))
    artist = match[0].strip()
    title = match[1].strip()

    return (artist, title)


def get_review_data(video):
    """ Function:   get_review_data
        Parameters: video, dict containing video metadata
        Returns:    dict, a cleaned, flattened dict of review metadata
    """
    snippet = video["snippet"]
    title = snippet["title"]
    description = snippet["description"]

    # Filter out unnecessary keys.
    keep = ["publishedAt", "title"]
    filtered_snippet = {k: v
                        for k, v in snippet.items() if k in keep}

    # Enrich with parsed artist, title, genre, and rating information.
    artist, title = get_artist_and_title(title)
    filtered_snippet["artist"] = artist
    filtered_snippet["title"] = title
    filtered_snippet["rating"] = get_rating(description)
    filtered_snippet["genres"] = get_genres(description)

    return filtered_snippet


def parse_reviews(videos):
    """ Function:   parse_reviews
        Parameters: videos, list of dict containing all theneedledrop videos
        Returns:    list of dict, a list of all parser reviews
    """
    return sorted([get_review_data(video) for video in videos if is_review(video)],
                  key=lambda r: datetime.strptime(
        r["publishedAt"], ISO8601_FORMAT),
        reverse=True)
