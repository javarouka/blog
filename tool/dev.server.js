import fs from 'fs'
import path from 'path'
import Express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from './webpack.config.dev.js'

const compiler = webpack(webpackConfig);
const port = 9999;

const app = new Express();

app.use(webpackDevMiddleware(compiler, {
	publicPath: '/',
	hot: true,
	stats: {
		colors: true
	}
}));

app.use(webpackHotMiddleware(compiler));
app.use(Express.static(path.resolve(__dirname, '../')));

app.listen(port, err => {
	if (err) {
		console.error(err);
	} else {
		console.info('Webpack development server started %s', webpackConfig.output.publicPath);
	}
});