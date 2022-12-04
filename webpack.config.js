const path = require('path');
const webpack = require('webpack');
const target = process.env.npm_lifecycle_event;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const styleCss = new ExtractTextPlugin("css/style.[hash:7].css");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

var PATHS = {
	src: path.join(__dirname, 'src'),
	dist: path.join(__dirname),
}

const PACKAGE = require('./package.json');
const ProductInfo = `\nProduct name/Version: ${PACKAGE.name} ${PACKAGE.version}\n`;

module.exports = (env, argv) => {
	const config = {
		entry: {
			lib: ['jquery'],
			doc_viewer: [
				path.join(PATHS.src, 'ts'),
				path.join(PATHS.src, 'scss', 'style.scss'),
			]
		},
		output: {
			filename: 'js/[name].[hash:7].js',
			path: PATHS.dist
		},
		context: __dirname,
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: [
						{ loader: 'cache-loader' },
						{
							loader: 'thread-loader',
							options: {
								workers: require('os').cpus().length - 1
							}
						},
						{
							loader: 'ts-loader',
							options: {
								happyPackMode: true
							}
						}
					],
					exclude: /node_modules/
				},
				{
					test: path.resolve(__dirname, 'src', 'scss', 'style.scss'),
					use: styleCss.extract({
						fallback: 'style-loader',
						use: ['css-loader','sass-loader'],
					}),
				},
			]
		},
		resolve: {
			extensions: ['.ts', '.js' ]
		},
		optimization: {
			splitChunks: {
				cacheGroups: {
					lib: {
						test: /[\\/]node_modules[\\/]/,
						name: 'lib',
						chunks: 'all',
					}
				}
			}
		},
		plugins: [
			new ForkTsCheckerWebpackPlugin({checkSyntacticErrors:true}),
			new HtmlWebpackPlugin({
				template: 'src/doc.html',
				filename: 'doc.html',
			}),
			new webpack.BannerPlugin(ProductInfo),
			new webpack.ProvidePlugin({
				Promise: 'core-js/features/promise',
				Map: 'core-js/features/map',
				'Object.assign': 'core-js/features/object/assign',
			}),
			styleCss
		]
	}

	if (argv.mode === 'development') {
		config.plugins.push(new webpack.HotModuleReplacementPlugin());
		config.devtool = 'inline-source-map';
		config.devServer = {
			historyApiFallback: true,
			progress: true,
			inline: true,
			port: 4000,
			compress: true,
			contentBase: __dirname,
		};
	}

	if (argv.mode === 'production') {
		config.plugins.push(new OptimizeCssAssetsPlugin());
		config.performance = {
			hints: false
		};
	}
    const version = argv.viewer_version === 'v2019' ? 'v2019' : 'v2022'
	config.plugins.push( new webpack.DefinePlugin({ __SERVICE_VERSION__ : JSON.stringify(version) }) );
	return config;
}