let fs = require('fs')
let path = require('path')
let express = require('express')
let nodeify = require('bluebird-nodeify')
let morgan = require('morgan')
let mime = require('mime-types')
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

let app = express()
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.listen(PORT, () => console.log(`LISTENING AT http://127.0.0.1:${PORT}`))

app.get('*', setHeaders, (req, res) => {
  if (res.body) {
    res.json(res.body)
    return
  }
  fs.createReadStream(req.filepath).pipe(res)
})

app.head('*', setHeaders, (req, res) => res.end())

function setHeaders(req, res, next) {
  nodeify(async () => {
    let filepath = path.resolve(path.join(ROOT_DIR, req.url))
    req.filepath = filepath
    if (filepath.indexOf(ROOT_DIR) !== 0) {
      res.send(400, 'Invalid Path')
      return
    }

    let stat = await fs.promise.stat(filepath)

    if (stat.isDirectory()) {
      let files = await fs.promise.readdir(filepath)
      res.body = JSON.stringify(files)
      res.setHeader('Content-Length', res.body.length)
      res.setHeader('Content-Type', 'application/json')
      return
    }

    res.setHeader('Content-Length', stat.size)
    let contentType = mime.contentType(path.extname(filepath))
    res.setHeader('Content-Type', contentType)
  }(), next)
}
