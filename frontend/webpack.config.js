const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (_env, argv) => {
  const mode = process.env.NODE_ENV || argv.mode || "development";
  const isProduction = mode === "production";

  // setting env file
  const envFile = isProduction ? ".env.production" : ".env";
  const { parsed = {} } = dotenv.config({
    path: path.resolve(__dirname, envFile),
    quiet: true,
  });

  // every key the browser code may read, so each one is always replaced even
  // when no env file exists (a fresh clone, or a docker build using build args).
  // leaving one unreplaced ships a literal `process.env.X` and the page dies
  // with "process is not defined".
  const CLIENT_ENV_KEYS = ["API_BASE_URL"];

  // a real env var wins over the file (docker build --build-arg), then the
  // file, then an empty string so the reference always resolves
  const envKeys = [...new Set([...CLIENT_ENV_KEYS, ...Object.keys(parsed)])].reduce(
    (acc, key) => {
      acc[`process.env.${key}`] = JSON.stringify(
        process.env[key] || parsed[key] || ""
      );
      return acc;
    },
    {}
  );

  console.log(`[${mode}] webpack loaded ${envFile}`);

  return {
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      clean: true,
      publicPath: "/",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
      new webpack.DefinePlugin(envKeys),
    ],
    devServer: {
      static: path.resolve(__dirname, "public"),
      historyApiFallback: true,
      port: Number(parsed.PORT) || 3001,
      open: false,
      hot: true,
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};
