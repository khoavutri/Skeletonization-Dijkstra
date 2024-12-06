const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const baseConfig = (isProduction) => {
  const config = {
    entry: {
      khoadev: "./src/index.ts",
    },
    output: {
      library: "khoadev",
      filename: isProduction ? "[name].min.js" : "[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
      libraryTarget: "umd",
      clean: true,
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    },
    performance: {
      hints: false,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/i,
          loader: "ts-loader",
          exclude: ["/node_modules/"],
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
          type: "asset",
        },
        {
          test: /\.glsl$/,
          loader: "webpack-glsl-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
      }),
      new webpack.BannerPlugin({
        banner: "The product is owned by Vu Tri Khoa",
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CopyPlugin({
          patterns: [{ from: "public", to: "public" }],
        }),
      ],
    },
    devtool: "source-map",
    mode: isProduction ? "production" : "development",
    watch: false,
  };

  if (!isProduction) {
    config.devServer = {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      open: true,
      host: "0.0.0.0",
      port: 8080,
    };
  }

  return config;
};

module.exports = (() => {
  const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "";
  switch (env) {
    case "production":
      return baseConfig(true);
    case "development":
      return baseConfig(false);
    default:
      return [baseConfig(false), baseConfig(true)];
  }
})();
