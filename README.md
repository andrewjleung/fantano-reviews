# fantano-reviews

This is a project for DS2500 at NEU, encompassing the creation and analysis of a dataset of all
music reviews with ratings by Anthony Fantano
([theneedledrop](https://www.youtube.com/user/theneedledrop)) on YouTube.

To generate an updated dataset, you will first need to generate an API key for the [YouTube Data
API v3](https://cloud.google.com/docs/authentication/api-keys?authuser=1). Place this within a file
called `api_key.json` inside the `fantano-fetch` directory.

After this, run `make` to create and source the project's virtual environment.

Finally, you can fetch and generate an updated review dataset with the following command:

```python
python3 fantano_fetch.py -f
```

You can then open `fantano_genre.ipynb` within Jupyter Notebook which will make use of this dataset
for analysis.
