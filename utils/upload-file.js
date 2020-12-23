/* eslint-disable indent */
const fs = require('fs');

const uploadDir = 'uploads';

function makeFolderUpload(dir) {
    const path = `${uploadDir}/${dir}`;
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    return path;
}

function readFileAsBase64(path) {
    return fs.readFileSync(path, { encoding: 'base64' });
}

module.exports = {
    makeFolderUpload,
    readFileAsBase64,
};
