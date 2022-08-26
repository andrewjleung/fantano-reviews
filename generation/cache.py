import json
import os
from os.path import exists


class Cache():
    """
    Class for caching computations. Provides a means to retrieve the result of a
    computation either from a cache if it exists or by running the computation,
    caching the result as a side effect.
    """

    def __init__(self, cache_path, computation, use_cache=True):
        self.cache_path = cache_path
        # This is a zero-arg function that returns the JSON-serializable result to be cached.
        self.computation = computation
        self.use_cache = use_cache

    def __enter__(self):
        self.get()

    def __exit__(self, exc_type, exc_value, exc_traceback):
        pass

    def get(self):
        """ Function:   get
            Parameters: None
            Return:     any, the result of this Cache's computation if no cache
                            exists or the cache if it does
        """
        if exists(self.cache_path) and self.use_cache:
            with open(self.cache_path, "r", encoding="utf-8") as cache_file:
                return json.load(cache_file)

        with open(self.cache_path, "w+", encoding="utf-8") as cache_file:
            try:
                result = self.computation()
                cache_file.write(json.dumps(result))
                return result
            except Exception as exception:
                os.remove(self.cache_path)
                raise
