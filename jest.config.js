module.exports = {
  "globals": {
    "ts-jest": {
      "tsConfig": "tsconfig.test.json"
    }
  },
  "transform": {
    ".ts": "ts-jest"
  },
  "testRegex": "\\.test\\.ts$",
  "moduleFileExtensions": [
    "js",
    "ts"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "\\.test\\.ts$"
  ],
}
