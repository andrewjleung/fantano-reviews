import pandas as pd


class Reviews:
    '''
    Wrapper class for Anthony Fantano review data with utilities to search and aggregate data.
    '''

    def __init__(self, filename=None, df=None):
        if filename is not None:
            self.df = pd.read_csv(filename)
            self.df["publishedAt"] = pd.to_datetime(self.published_at())
        elif df is not None:
            self.df = df
        else:
            raise ValueError(
                "Need to supply a datasource filename or dataframe")

    def artist(self):
        '''
        Function:   artist
        Parameters: none
        Returns:    series, the artist column within the review dataframe
        '''
        return self.df["artist"]

    def title(self):
        '''
        Function:   title
        Parameters: none
        Returns:    series, the title column within the review dataframe
        '''
        return self.df["title"]

    def rating(self):
        '''
        Function:   rating
        Parameters: none
        Returns:    series, the rating column within the review dataframe
        '''
        return self.df["rating"]

    def genres(self):
        '''
        Function:   genres
        Parameters: none
        Returns:    series, the genres column within the review dataframe
        '''
        return self.df["genres"]

    def published_at(self):
        '''
        Function:   published_at
        Parameters: none
        Returns:    series, the published_at column within the review dataframe
        '''
        return self.df["publishedAt"]

    def on_genres(self, fn):
        ''' Function:   on_genres
            Parameters: fn, function to execute on a list of genres for a single review
            Returns:    series, result of applying the function on the genres column
        '''
        return [fn(str(genres).split("; ")) for genres in self.genres()]

    def get_by_artist(self, artist):
        ''' Function:   get_by_artist
            Parameters: artist, the exact artist to search for
            Returns:    Review, reviews of the given artist
        '''
        return Reviews(df=self.df.loc[self.artist() == artist])

    def get_by_rating(self, rating):
        ''' Function:   get_by_rating
            Parameters: rating, the exact rating to search for
            Returns:    Review, reviews with the given rating
        '''
        if rating > 10 or rating < 0:
            raise ValueError(f"Invalid rating: {rating}")

        return Reviews(df=self.df.loc[self.rating() == rating])

    def get_all_genres(self):
        ''' Function:   all_genres
            Parameters: none
            Returns:    set, all distinct genres
        '''
        genres_set = set()

        for genres in self.genres():
            for genre in str(genres).split(";"):
                genres_set.add(genre)

        return genres_set

    def is_in_genres(self, genre):
        ''' Function:   is_in_genres
            Parameters: genre
            Returns:    bool, whether the given genre has been reviewed
        '''
        return genre in self.get_all_genres()

    def get_by_genre(self, genre):
        ''' Function:   get_by_genre
            Parameters: genre, the exact genre to filter reviews by
            Return      Review, all reviews of works of the given genre
        '''
        return Reviews(df=self.df.loc[self.on_genres(lambda genres: genre in genres)])

    def get_by_genre_word(self, genre_word):
        ''' Function:   get_by_genre_word
            Parameters: genre_word, the genre word to filter reviews by
            Return      Review, all reviews of works with a genre with the given genre word

        '''
        return Reviews(df=self.df.loc[
            self.on_genres(lambda genres: any(
                (genre_word in list(genre.split(" "))) for genre in genres))])

    def get_by_genre_substr(self, genre_substr):
        ''' Function:   get_by_genre_substr
            Parameters: genre_substr, the genre substring to filter reviews by
            Return      Review, all reviews of works with a genre with the given genre substring

        '''
        return Reviews(df=self.df.loc[
            self.on_genres(lambda genres: any((genre_substr in genre) for genre in genres))])

    def mean_rating(self):
        ''' Function:   mean_rating
            Parameters: none
            Returns:    tuple (float, int),
                        (the mean rating of this collection of reviews, the number of reviews)
        '''
        return (self.df["rating"].mean(), len(self.df))
