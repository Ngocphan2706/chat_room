const fs = require('fs');

const uploadDir = 'uploads'

function makeFolderUpload(dir){
    let path = `${uploadDir}/${dir}`;
    if(!fs.existsSync(path)) {
        fs.mkdirSync(path)
    }
    return path;
}

function readFileAsBase64(path){
    let data = fs.readFileSync(path, {encoding: 'base64'});
    return data;
}

module.exports = {
    makeFolderUpload,
    readFileAsBase64
}
