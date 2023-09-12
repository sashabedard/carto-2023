//node 18 minimum

import fetch, { Headers } from "node-fetch";
import fs from "fs";
import path from "path";
import _ from "lodash";

import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
}

import { pipeline } from "@xenova/transformers";

var dummy = "cats are pretty, i guess"; // "I love transformers!";

const RERUN_ALL_CLIP = true;
const CLIP_MODEL = "Xenova/clip-vit-large-patch14"; // "Xenova/clip-vit-base-patch16"; // "openai/clip-vit-base-patch32";

import {
  AutoProcessor,
  AutoTokenizer,
  RawImage,
  CLIPVisionModelWithProjection,
  CLIPTextModelWithProjection,
} from "@xenova/transformers";

// Load processor and vision model
const model_id = CLIP_MODEL; //"Xenova/clip-vit-base-patch16";
const processor = await AutoProcessor.from_pretrained(model_id);
const vision_model = await CLIPVisionModelWithProjection.from_pretrained(
  model_id,
  {
    quantized: false,
  }
);

async function clipByUrl(url) {
  try {
    var image = await RawImage.read(url);
    // Read image and run processor
    let image_inputs = await processor(image);

    // Compute embeddings
    const { image_embeds } = await vision_model(image_inputs);
    const embed_as_list = image_embeds.tolist()[0];
    console.log(embed_as_list.length, "clipByUrl", url);
    return embed_as_list;
  } catch (e) {
    // Unable to load image, so we ignore it
    console.warn("Ignoring image due to error", e, url);
    throw e;
  }
}

// Assuming you've imported path at the beginning of your code
const projectRoot = path.resolve(__dirname, ".."); // Moves one directory up from current

async function saveEmbeddingToFile(embed_as_list, imagePath) {
  // Extract the directory name of the imagePath
  const dirname = path.relative(projectRoot, path.dirname(imagePath));

  // Create a new directory path for storing embeddings
  const newDir = path.join(projectRoot, "data", dirname);

  // Use the same filename logic as before
  const filenameWithoutExt = path.basename(imagePath, path.extname(imagePath));
  const savePath = path.join(newDir, `${filenameWithoutExt}.txt`);

  // Ensure the directory exists
  if (!fs.existsSync(path.dirname(savePath))) {
    fs.mkdirSync(path.dirname(savePath), { recursive: true });
  }

  fs.writeFileSync(savePath, JSON.stringify(embed_as_list));
}

async function clipImageAndSave(imgPath) {
  console.log(`Starting process for: ${imgPath}`); // To see the image path being processed

  const dirname = path.dirname(imgPath);
  console.log(`Directory of image: ${dirname}`);

  const filenameWithoutExt = path.basename(imgPath, path.extname(imgPath));
  var savePath = path.join(dirname, `${filenameWithoutExt}.txt`);
  savePath = savePath.replace("concepts", "data/concepts/");
  console.log(`Intended save path: ${savePath}`);

  if (RERUN_ALL_CLIP || !fs.existsSync(savePath)) {
    console.log(`Processing image: ${imgPath}`);

    const url = clipLocalPath(imgPath);
    console.log(`Converted local path to URL: ${url}`);

    const embed_as_list = await clipByUrl(url);
    console.log(`Embedding generated with length: ${embed_as_list.length}`);

    await saveEmbeddingToFile(embed_as_list, imgPath);
    console.log(`💪 Processed and saved embedding for: ${imgPath}`);
  } else {
    console.log(`✅ Embedding already exists for: ${imgPath}`);
  }
}

async function clipImages(images) {
  const chunks = _.chunk(images, 10);
  for (const chunk of chunks) {
    await Promise.all(chunk.map((imgPath) => clipImageAndSave(imgPath)));
  }
}

//import { fileURLToPath } from "url";

function clipLocalPath(localPath) {
  let fullpath;

  // Check if the path is absolute
  if (path.isAbsolute(localPath)) {
    fullpath = localPath;
  } else {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    fullpath = path.join(__dirname, localPath);
  }

  return fullpath;
  const u = new URL(`file://${fullpath}`);
  console.log(u);
  return u.toString();
}

function scanImages(dir) {
  const allImages = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      allImages.push(...scanImages(filePath));
    } else if (
      [".jpg", ".jpeg", ".png", ".gif"].includes(
        path.extname(file).toLowerCase()
      )
    ) {
      allImages.push(filePath);
    }
  });

  return allImages;
}

const allImages = scanImages(path.join(__dirname, "../concepts"));
//const allImages = scanImages(path.join(import.meta.url, "../../concepts"));
clipImages(allImages);

clipByUrl(
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cat_August_2010-4.jpg/362px-Cat_August_2010-4.jpg"
);

clipByUrl(
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/1024px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg"
);

async function clipByText(text) {
  console.log("clip bu yxttx.");
  var text_model = await CLIPTextModelWithProjection.from_pretrained(
    CLIP_MODEL,
    {
      quantized: false,
    }
  );
  let tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL);
  let text_inputs = tokenizer(text, { padding: true, truncation: true });
  const { text_embeds } = await text_model(text_inputs);
  const query_embedding = text_embeds.tolist()[0];
  console.log(query_embedding.length, "clipByText:", text);
}

clipByText("cat");
// Allocate a pipeline for sentiment-analysis
let sentimentsPipe = await pipeline("sentiment-analysis");

let sentimentOut = await sentimentsPipe(dummy);

console.log(sentimentOut, dummy);
// [{'label': 'POSITIVE', 'score': 0.999817686}]

/*

TODO: ADA2


*/

const adaTokenizer = await AutoTokenizer.from_pretrained(
  "Xenova/text-embedding-ada-002"
);
const tokens = adaTokenizer.encode("hello world"); // [15339, 1917]
//Please note that this is only the tokenizer for the model, and does not contain any model weights, meaning it cannot be used for generating embeddings.
//The main purpose of this repo was to be able to count the number of tokens that will be sent to the OpenAI API.
