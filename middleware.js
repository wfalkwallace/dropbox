let fs = require('fs')
let path = require('path')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')

exports.setDirDetails = function(req, res, next) {
  let filepath = req.filepath
  let endsWithSlash = filepath.charAt(filepath.length - 1) === path.sep
  let hasExt = path.extname(filepath) !== ''
  req.isDir = endsWithSlash || !hasExt
  req.dirPath = req.isDir ? filepath : path.dirname(filepath)
  next()
};

exports.setFileMeta = function(req, res, next) {
  req.filepath = path.resolve(path.join(ROOT_DIR, req.url))
  if (req.filepath.indexOf(ROOT_DIR) !== 0) {
    res.send(400, 'Invalid Path')
    return
  }
  fs.promise.stat(req.filepath)
    .then(stat => req.stat = stat, () => req.stat = null)
    .nodeify(next)
};

exports.setHeaders = function(req, res, next) {
  nodeify(async () => {
    if (req.stat.isDirectory()) {
      let files = await fs.promise.readdir(req.filepath)
      res.body = JSON.stringify(files)
      res.setHeader('Content-Length', res.body.length)
      res.setHeader('Content-Type', 'application/json')
      return
    }

    res.setHeader('Content-Length', req.stat.size)
    let contentType = mime.contentType(path.extname(req.filepath))
    res.setHeader('Content-Type', contentType)
  }(), next)
};
