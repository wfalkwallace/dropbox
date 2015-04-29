let fs = require('fs')
let path = require('path')
let express = require('express')
let nodeify = require('bluebird-nodeify')
let morgan = require('morgan')
let mime = require('mime-types')
let rimraf = require('rimraf')
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

let app = express()
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.listen(PORT, () => console.log(`LISTENING AT http://127.0.0.1:${PORT}`))

app.get('*', setFileMeta, setHeaders, (req, res) => {
  if (res.body) {
    res.json(res.body)
    return
  }
  fs.createReadStream(req.filepath).pipe(res)
})

app.head('*', setFileMeta, setHeaders, (req, res) => res.end())

function setFileMeta(req, res, next) {
  req.filepath = path.resolve(path.join(ROOT_DIR, req.url))
  if (req.filepath.indexOf(ROOT_DIR) !== 0) {
    res.send(400, 'Invalid Path')
    return
  }
  fs.promise.stat(req.filepath)
    .then(stat => req.stat = stat, () => req.stat = null)
    .nodeify(next)
}

function setHeaders(req, res, next) {
  nodeify(async () => {
    if (req.stat.isDirectory()) {
      let files = await fs.promise.readdir(req.filepath)
      res.body = JSON.stringify(files)
      res.setHeader('Content-Length', res.body.length)
      res.setHeader('Content-Type', 'application/json')
      return
    }

    res.setHeader('Content-Length', stat.size)
    let contentType = mime.contentType(path.extname(req.filepath))
    res.setHeader('Content-Type', contentType)
  }(), next)
}

app.delete('*', setFileMeta, (req, res, next) => {
  async () => {
    if (!req.stat) {
      res.send(400, 'Invalid Path')
      return
    }
    if (req.stat && req.stat.isDirectory()) {
      await rimraf.promise(req.filepath)
    } else {
      await fs.promise.unlink(req.filepath)
    }
    res.end()
  }().catch(next)
})
