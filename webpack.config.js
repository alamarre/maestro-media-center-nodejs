const path = require("path");
const debug = process.env.NODE_ENV !== "production";
const FOR_LAMBDA = process.env.FOR_LAMBDA;

const externals = [];
if(FOR_LAMBDA) {
  externals["aws-sdk"] = "aws-sdk";
}

const lambdaName = process.env.LAMBDA_NAME || "server";


module.exports = {
  entry: `./src/lambdas/${lambdaName}.ts`,
  devtool: "source-map",
  target: "node",
  mode: debug ? "development" : "production",
  optimization: {
    minimize: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals,
  resolve: {
    extensions: [ ".tsx", ".ts", ".js", ],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist", lambdaName),
    libraryTarget: "umd",
  },
};