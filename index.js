let fs = require('fs')
let path = require('path')
let express = require('express')
let nodeify = require('bluebird-nodeify')
let morgan = require('morgan')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let middleware = require('./middleware')
// let bluebird = require('bluebird')
// bluebird.longStackTraces()
// require('longjohn')
require('songbird')
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .usage('Usage: bode index.js [options]')
    .help('h')
    .alias('h', 'help')
    .describe('host', 'Specify a destination host to connect to')
    .describe('port', 'Specify a destination port to connect to')
    .describe('url', 'Specify a destination url to connect to')
    .describe('log', 'Specify a logfile')
    .alias('l', 'log')
    .alias('f', 'log')
    .alias('p', 'port')
    .alias('u', 'url')
    .argv
const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000

let app = express()
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.listen(PORT, () => console.log(`LISTENING AT http://127.0.0.1:${PORT}`))

app.head('*', middleware.setFileMeta, middleware.setHeaders, (req, res) => res.end())

app.get('*', middleware.setFileMeta, middleware.setHeaders, (req, res) => {
  if (res.body) {
    res.json(res.body)
    return
  }
  fs.createReadStream(req.filepath).pipe(res)
})

app.delete('*', middleware.setFileMeta, (req, res, next) => {
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

app.put('*', middleware.setFileMeta, middleware.setDirDetails, (req, res, next) => {
  async () => {
    if (req.stat) {
      res.send(405, 'File Exists')
      return
    }

    await mkdirp.promise(req.dirPath)

    if (!req.isDir) {
      req.pipe(fs.createWriteStream(req.filepath))
    }
    res.end()

  }().catch(next)
})

app.post('*', middleware.setFileMeta, middleware.setDirDetails, (req, res, next) => {
  async () => {
    if (!req.stat) {
      res.send(405, 'File Does Not Exist')
      return
    }
    if (req.isDir) {
      res.send(405, 'Path is a Directory')
      return
    }

    await fs.promise.truncate(req.filepath, 0)
    req.pipe(fs.createWriteStream(req.filepath))
    res.end()

  }().catch(next)
})
