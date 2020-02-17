'use strict';
require('dotenv').config();
const Dropbox = require('dropbox').Dropbox
const fetch = require('node-fetch')
const debug = require('debug')('taskviz')
const express = require('express')
const exphb = require('express-handlebars')

const dbclient = new Dropbox({
  accessToken : process.env.DROPBOX_TOKEN,
  fetch : fetch
})

const app = express();
app.engine('handlebars', exphb())
app.set('view engine', 'handlebars')

app.get('/', (req, res) => {
  debug('GET /')
  fetch(new URL(`${req.protocol}://${req.hostname}:${req.client.localPort}${req.path}data`))
    .then(res => res.json())
    .then(data => {
      debug('Success from /data %O', data)
      res.render('home',  { tasks : data.filter(a => a.date != null && a.context != null) })
    })
    .catch((err) => {
      debug('Error from /data %s', err)
      res.render('error', { error_detail : err })
    })
})

app.get('/data', (req, res) => {
  debug('GET /data')
  dbclient.filesGetTemporaryLink({ path : process.env.DROPBOX_FILEPATH })
    .then((files) => {
      debug('Dropbox call success, got temp link', files.link)
      fetch(files.link)
        .then(fetchres => fetchres.text())
        .then(text => {
          debug('Fetch of temp link success %s', text)
          const tasks =  text.split('\n').map((task) => {
            debug('Task in map %s', task)
            const [full, done_date, priority, context, text] = 
              task.match(/^(?:x\s+(\d{4}-\d{2}-\d{2})\s+)?(?:\(([A-za-z]{1})\)\s+)?(?:(@\S+)\s+)?(.*)/i)
            if (full) {
              debug('Task match %o', full)
              return { context : context, task : text, date : done_date }
            } else {
              debug('Task regex didn\'t match %s', full)
              return null
            }
          }).filter(a => a != null)
          debug('Map done %O', tasks)
          res.status(200).json(tasks)
        })
        .catch((error) => {
          debug('Fetch of temp link, format failed %O', error)
          res.status(500).json(error)
        })
    })
    .catch((error) => {
      debug('Dropbox call failed %O', error)
      res.status(500).json(error)
    })
})

app.listen(process.env.PORT)
