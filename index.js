'use strict'
require('dotenv').config()
const Dropbox = require('dropbox').Dropbox
const fetch = require('node-fetch')
const express = require('express')
const exphb = require('express-handlebars')
const cache = require('node-cache')
const fs = require('fs')
const path = require('path')

const filecache = new cache()

const dbclient = new Dropbox({
  accessToken: process.env.DROPBOX_TOKEN,
  fetch: fetch
})

const app = express()
app.engine('handlebars', exphb())
app.set('view engine', 'handlebars')

function getData (req) {
  return fetch(new URL(`${req.protocol}://${req.hostname}:${req.client.localPort}/data`)).then(res => res.json())
}

app.get('/', (req, res) => {
  const debug = require('debug')('taskviz')
  getData(req).then(data => {
    debug('Success from /data %O', data)
    res.render('home', { tasks: data.filter(a => a.date != null && a.context != null) })
  })
    .catch((err) => {
      debug('Error from /data %s', err)
      res.render('error', { error_detail: err })
    })
})

app.get('/treemap', (_req, res) => {
  res.render('treemap')
})

app.get('/static/:asset', (req, res) => {
  const debug = require('debug')('taskviz:static')
  if (!req.params.asset) {
    debug('400'); res.status(400).end('Missing asset parameter')
  } else if (!req.params.asset.match('[A-Za-z0-9\.]')) {
    debug(`400 ${req.params.asset}`); res.status(400).end('Invalid asset name')
  } else {
    res.status(200)
    debug(`Asset param OK, attempting stream of ${req.params.asset}`)
    const filepath = path.format({ dir: process.env.STATIC_PATH, base: req.params.asset })
    const s = fs.createReadStream(filepath)
    s.on('error', e => {
      if (e.code === 'ENOENT') {
        debug(`404 on ${filepath}`); res.status(404).end()
      } else {
        debug(`500 ${e}`); res.status(500).end()
      }
    })
    s.pipe(res)
  }
})

function getFile (filename) {
  var cachedfile = filecache.get(filename)
  const debug = require('debug')('taskviz:cache')
  if (!cachedfile) {
    debug(`Cache miss on ${filename}`)
    return new Promise((resolve, reject) => {
      dbclient.filesGetTemporaryLink({ path: filename })
        .then(files => { debug('Dropbox link fetch success'); return fetch(files.link) })
        .then(res => { debug('Fetch of temp link success'); return res.text() })
        .then(text => {
          debug('Text of temp link fetch success')
          filecache.set(filename, text)
          resolve(text)
        })
    })
  } else {
    debug(`Cache hit on ${filename}`)
    return Promise.resolve(cachedfile)
  }
}

app.get('/data/:from/:to', (req, res) => {
  const debug = require('debug')('taskviz:api')

  const fromMatch = req.params.from.match(/(\d{4})-(\d{2})-(\d{2})/)
  const toMatch = req.params.to.match(/(\d{4})-(\d{2})-(\d{2})/)

  if (fromMatch === null || toMatch === null) {
    res.status(400).end('from and to parameters must be yyyy-mm-dd dates')
  } else {
    const fromDate = new Date(fromMatch[1], fromMatch[2] - 1, fromMatch[3])
    const toDate = new Date(toMatch[1], toMatch[2] - 1, toMatch[3])

    getFile(process.env.DROPBOX_FILEPATH)
      .then(text => {
        debug('Fetch of file success')
        const tasks = text.split('\n').map((task) => {
          const regmatch = task.match(/^(?:x\s+(\d{4})-(\d{2})-(\d{2})\s+)(?:\(([A-za-z]{1})\)\s+)?(?:@(\S+)\s+)(.*)/i)
          if (regmatch) {
            const [full, year, month, day, priority, context, text] = regmatch
            const taskDate = new Date(year, month - 1, day)
            debug('Task match %o', full)
            const project = text.match(/\+(\w+)/)
            if (fromDate <= taskDate && taskDate <= toDate) {
              return {
                context: context,
                priority: priority,
                project: project ? project[1] : null,
                task: text,
                date: {
                  year: year,
                  month: month,
                  day: day
                }
              }
            } else {
              return null
            }
          } else {
            debug('Task regex didn\'t match %s', task)
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
  }
})

app.get('/data', (_req, res) => {
  const debug = require('debug')('taskviz:api')
  getFile(process.env.DROPBOX_FILEPATH)
    .then(text => {
      debug('Fetch of file success')
      const tasks = text.split('\n').map((task) => {
        const regmatch = task.match(/^(?:x\s+(\d{4})-(\d{2})-(\d{2})\s+)(?:\(([A-za-z]{1})\)\s+)?(?:@(\S+)\s+)(.*)/i)
        if (regmatch) {
          const [full, year, month, day, priority, context, text] = regmatch
          debug('Task match %o', full)
          const project = text.match(/\+(\w+)/)
          return { context: context, priority: priority, project: project ? project[1] : null, task: text, date: new Date(year, month, day) }
        } else {
          debug('Task regex didn\'t match %s', task)
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

app.listen(process.env.PORT)
