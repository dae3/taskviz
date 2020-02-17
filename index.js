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
  dbclient.filesGetTemporaryLink({ path : process.env.DROPBOX_FILEPATH })
    .then((files) => {
      debug('Dropbox call success, got temp link', files.link)
      fetch(files.link)
        .then(fetchres => fetchres.text())
        .then(text => {
          debug('Fetch of temp link success %s', text)
          const tasks =  text.split('\n').map((task) => {
            debug('Task in map %s', task)
            const split_task = task.match(/^(?:x\s+\d{4}-\d{2}-\d{2}\s+)?(?:\(([A-za-z]{1})\)\s+)?(?:(@\S+)\s+)?(.*)/i)
            debug('Task match %o', split_task)
            if (!split_task) { debug('NO MATCH %s', task) }
            return { context : split_task[2], task : split_task[3]}
          })
          debug('Map done %O', tasks)
          res.render('home',  { tasks : tasks })
        })
        .catch((error) => {
          debug('Fetch of temp link, format failed %O', error)
          res.render('error', { error_detail : error })
        })
    })
    .catch((error) => {
      debug('Dropbox call failed %O', error)
      res.render(
        'error',
        { 'error_detail': error.error }
      )
    })
})

app.listen(process.env.PORT)
