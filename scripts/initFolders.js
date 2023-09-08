const fs = require("fs");
const path = require("path");
const readline = require("readline");
const stream = require("stream");

// Load CSV file
const inputFile = "data/concepts.csv"; // Replace 'your_data.csv' with the path to your CSV

const readStream = fs.createReadStream(inputFile);
const rl = readline.createInterface({
  input: readStream,
  output: new stream.PassThrough(),
});

// Skip the header
let isHeader = true;

rl.on("line", function (line) {
  if (isHeader) {
    isHeader = false;
    return;
  }

  // Split line by commas
  const parts = line.split(",");

  // Extract the id (folder name)
  const folderName = parts[0].trim();

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
  }

  // Create a .gitkeep file within the folder
  fs.closeSync(fs.openSync(path.join(folderName, ".gitkeep"), "w"));
});

rl.on("close", function () {
  console.log("Finished processing the CSV.");
});
