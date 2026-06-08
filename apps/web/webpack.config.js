const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

const ROOT = findMonorepoRoot(__dirname)
loadEnv({ rootDir: ROOT })

const { env } = require("./src/config/env")

const isDev = process.env.NODE_ENV !== "production"
const publicPathRaw = String(env.PUBLIC_PATH || "/")
const publicPath = publicPathRaw.endsWith("/") && publicPathRaw !== "/"
  ? publicPathRaw
  : publicPathRaw === "/"
    ? "/"
    : `${publicPathRaw}/`

const browserApiBase = isDev
  ? "/api"
  : publicPathRaw === "" || publicPathRaw === "/"
    ? "/api"
    : publicPathRaw.replace(/\/$/, "")

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: isDev ? "development" : "production",
  target: "web",
  entry: "./src/main.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isDev ? "js/[name].js" : "js/[name].[contenthash:8].js",
    publicPath,
    clean: true,
  },
  resolve: {
    extensions: [".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [
          isDev ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/,
        type: "asset/resource",
        generator: { filename: "assets/[name].[hash:8][ext]" },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new webpack.DefinePlugin({
      __API_BASE_URL__: JSON.stringify(browserApiBase),
    }),
    !isDev && new MiniCssExtractPlugin({ filename: "css/[name].[contenthash:8].css" }),
  ].filter(Boolean),
  devServer: {
    port: env.WEB_PORT,
    hot: true,
    historyApiFallback: true,
    proxy: [{ context: ["/api"], target: `http://localhost:${env.API_PORT}` }],
    static: { directory: path.join(__dirname, "public") },
  },
  devtool: isDev ? "eval-source-map" : "source-map",
}
