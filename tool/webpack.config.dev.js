import path from 'path'
import webpack from 'webpack'
import precss from 'precss'
import autoprefixer from 'autoprefixer'
import generatorPost from './generatorPost'


const basePath = path.resolve(__dirname, '../src');
const host = 'localhost';
const port = 9999;

export default {

	devtool: 'heap-module-eval-source-map',
	context: basePath,

	entry: [
		'webpack-hot-middleware/client?path=http://' + host + ':' + port + '/__webpack_hmr',
		'webpack/hot/only-dev-server',
		path.join(basePath, 'app.js')
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
				test: /\.scss/,
				loader: 'style!css!postcss-loader!resolve-url!sass'
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

	postcss() {
		return [precss, autoprefixer];
	},

	resolve: {

		root: [
			basePath
		],

		extensions: [ '', '.js' ]
	},

	node: {
		fs: "empty"
	},

	plugins: [
		...generatorPost,
		new webpack.HotModuleReplacementPlugin()
	]
}