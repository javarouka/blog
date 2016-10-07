import fs from 'fs';
import path from 'path';
import recursiveReadSync from 'recursive-readdir-sync';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const postPath = path.resolve(__dirname, '../src/posts');
const destPath = path.resolve(__dirname, 'posts');

const files = recursiveReadSync(postPath);
export default files.map(file => {
    const fileName = file.substr(destPath.length);
    return new HtmlWebpackPlugin({
        template: file,
        filename: fileName
    })
});