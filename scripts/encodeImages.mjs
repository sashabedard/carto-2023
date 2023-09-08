import fetch, { Headers } from "node-fetch";

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
}

import { pipeline } from "@xenova/transformers";

var dummy = "cats are pretty, i guess"; // "I love transformers!";

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
    console.log(embed_as_list, "clipByUrl", url);
  } catch (e) {
    // Unable to load image, so we ignore it
    console.warn("Ignoring image due to error", e);
    throw e;
  }
}

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
  console.log(query_embedding, "clipByText", text);
}

clipByText("cat");
// Allocate a pipeline for sentiment-analysis
let sentimentsPipe = await pipeline("sentiment-analysis");

let sentimentOut = await sentimentsPipe(dummy);

console.log(sentimentOut, dummy);
// [{'label': 'POSITIVE', 'score': 0.999817686}]
