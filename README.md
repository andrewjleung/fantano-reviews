# fantano-reviews

This is a project originally for DS2500 at NEU, encompassing the generation of a dataset containing
all (or as many as my parser can recognize) music reviews with ratings by Anthony Fantano
([theneedledrop](https://www.youtube.com/user/theneedledrop)) on YouTube.

## Dataset Generation

To generate an updated dataset, you will first need to generate an API key for the [YouTube Data
API v3](https://cloud.google.com/docs/authentication/api-keys?authuser=1). Place this within a file
called `api_key.json` inside the `fantano-fetch` directory.

After this, run `make` to create the project's virtual environment. Then, source the environment
yourself with the following:

```bash
source ./generation/.venv/bin/activate
```

Finally, you can fetch and generate an updated review dataset with the following command:

```python
python3 generation/generate_dataset.py -f -d
```

## Callback Server

This repository also contains code for a [PubSubHubbub](https://github.com/pubsubhubbub/) callback
server within the `server` directory. This server responds to push notifications whenever Fantano
uploads or modifies a video
(see docs [here](https://developers.google.com/youtube/v3/guides/push_notifications)), live updating
the dataset which is hosted at
[andrewjleung/tnd-reviews](https://github.com/andrewjleung/tnd-reviews).
