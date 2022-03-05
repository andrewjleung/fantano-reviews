import { writeFile } from "fs";
import { getReviews } from "./fantano.js";

const makeCsv = (items, header) =>
  [
    header.join(","), // header row first
    ...items.map((row) => header.map((fieldName) => row[fieldName]).join(",")),
  ].join("\r\n");

const reviews = getReviews("./bin/all_videos.json");
const reviewsJSON = JSON.stringify(reviews);
const reviewsCSV = makeCsv(reviews, [
  "artist",
  "title",
  "rating",
  "genres",
  "publishedAt",
]);

writeFile("./bin/reviews.json", reviewsJSON, "utf8", () => {});
writeFile("./bin/reviews.csv", reviewsCSV, "utf8", () => {});
