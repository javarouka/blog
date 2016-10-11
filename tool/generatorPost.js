import fs from 'fs';
import path from 'path';
import recursiveReadSync from 'recursive-readdir-sync';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const postPath = path.resolve(__dirname, '../src/posts');
const destPath = path.resolve(__dirname, 'posts');

const files = recursiveReadSync(postPath);
const generatorConfig = files.map(file => {
    const fileName = file.substr(destPath.length);
    return new HtmlWebpackPlugin({
        realPath: file,
        template: file,
        filename: fileName
    })
});

const lastPost = generatorConfig[generatorConfig.length - 1];
const lastConfig = new HtmlWebpackPlugin({
    template: lastPost.options.template,
    filename: 'index.html'
});

export default [ lastConfig, ...generatorConfig ];