const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const inputFile = "data/concepts.csv"; // Path to your CSV file

fs.readFile(inputFile, "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading the file: ${err}`);
    return;
  }

  // Parse CSV using PapaParse
  const parsedData = Papa.parse(data, {
    header: true,
    skipEmptyLines: true,
  });

  parsedData.data.forEach((row) => {
    const folderName = row.id ? row.id.trim() : "";
    const etudiant = row.étudiant ? row.étudiant.trim() : "";

    // Skip if id or étudiant is empty
    if (!folderName || !etudiant) {
      return;
    }

    console.log(etudiant, "etudiant");

    const finalFolderPath = path.join("concepts", etudiant, folderName);

    // Create folder if it doesn't exist
    if (!fs.existsSync(finalFolderPath)) {
      fs.mkdirSync(finalFolderPath, { recursive: true });
    }

    // Create a .gitkeep file within the folder
    fs.closeSync(fs.openSync(path.join(finalFolderPath, ".gitkeep"), "w"));
  });

  console.log("Finished processing the CSV.");
});
