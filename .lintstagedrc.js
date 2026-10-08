const path = require("path");

const buildEslintCommand = (filenames) => {
   const files = filenames
      .map((f) => path.relative(process.cwd(), f))
      .filter((f) => !path.basename(f).startsWith("."));

   return files.length > 0
      ? `next lint --fix --file ${files.join(" --file ")}`
      : [];
};

module.exports = {
   "*.{js,jsx,ts,tsx}": [buildEslintCommand, "prettier --write"],
   "*.{json,css,md,html,yml,yaml}": ["prettier --write"],
};
