# fantano-reviews (WIP)

This is a project originally for DS2500 at NEU, encompassing the generation of a dataset containing
all (or as many as my parser can recognize) music reviews with ratings by Anthony Fantano
([theneedledrop](https://www.youtube.com/user/theneedledrop)) on YouTube.

## Dataset Generation

To generate an updated dataset, you will first need to generate an API key for the [YouTube Data
API v3](https://cloud.google.com/docs/authentication/api-keys?authuser=1). After getting a key,
setup a `.env` file using the provided template with the following command:

```bash
cp .env.template .env
```

Place the API key into this file as the `YTV3_API_KEY` property.

After this, install dependencies with the following:

```bash
yarn install # npm works too!
```

Finally, you can fetch and generate an updated review dataset with the following command:

```python
npm run generate-datasets
```

## Callback Server

This repository also contains code for a [PubSubHubbub](https://github.com/pubsubhubbub/) callback
server within the `server` directory. This server responds to push notifications whenever Fantano
uploads or modifies a video
(see docs [here](https://developers.google.com/youtube/v3/guides/push_notifications)), refreshing a
dataset hosted here: [andrewjleung/tnd-reviews](https://github.com/andrewjleung/tnd-reviews).
