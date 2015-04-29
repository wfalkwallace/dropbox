let express = require('express')
let nodeify = require('bluebird-nodeify')
let morgan = require('morgan')
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = process.cwd()

let app = express()
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.listen(PORT, () => console.log(`LISTENING AT http://127.0.0.1:${PORT}`))


