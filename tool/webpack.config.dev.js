import path from 'path'
import webpack from 'webpack'
import autoprefixer from 'autoprefixer'
import generatorPost from './generatorPost'

const basePath = path.resolve(__dirname, '../src');
const entryMainFile = path.join(basePath, 'app.js');
const host = 'localhost';
const port = 9999;

export default {

	devtool: 'heap-module-eval-source-map',
	context: basePath,

	entry: [
		//`webpack-dev-server/client?http://${host}:${port}/`,
		'webpack-hot-middleware/client?path=http://' + host + ':' + port + '/__webpack_hmr',
		'webpack/hot/dev-server',
		entryMainFile
	],

	output: {
		path: basePath + '/',
		filename: '[name].bundle.js',
		publicPath: '/'
	},

	module: {
		loaders: [

			{
				test: /\.js?$/,
				include: [
					basePath
				],
				exclude: [ /node_modules/ ],
				loader: 'babel?cacheDirectory'
			},

			{
				test: /\.css/,
				loader: 'style!css'
			},

			{
				test: /\.hbs$/, loader: "handlebars"
			},

			{
				test: /\.(html|txt|eot|ttf)/,
				loader: 'raw-loader'
			},

			{
				test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
				loader: 'url?limit=10000'
			}
		]
	},

	resolve: {

		root: [
			basePath
		],

		extensions: [ '', '.js' ]
	},

	plugins: [
		...generatorPost,
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin()
	]
}