const path = require("path");
const nodeBuiltins = require("builtin-modules");
const WebpackSourceMapSupport = require("webpack-source-map-support");

module.exports = {
  entry: "./scripts/ImportFromServer.js",
  target: "node",
  output: {
    path: path.join(__dirname, "build", "import"),
    filename: "backend.js",
    libraryTarget: "umd",
  },
  externals: [/^[^.]/,],
  plugins: [
    new WebpackSourceMapSupport(),
    //new webpack.BannerPlugin({banner: "require(\"source-map-support\").install();", raw: true,}),
  ],
  devtool: "source-map",
};