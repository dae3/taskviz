'use strict';
require('dotenv').config();
const Dropbox = require('dropbox').Dropbox
const fetch = require('node-fetch')
const express = require('express')
const exphb = require('express-handlebars')
const cache = require('node-cache')
const fs = require('fs')
const path = require('path')

const filecache = new cache()

const dbclient = new Dropbox({
	accessToken : process.env.DROPBOX_TOKEN,
	fetch : fetch
})

const app = express();
app.engine('handlebars', exphb())
app.set('view engine', 'handlebars')

function getData(req) {
	return fetch(new URL(`${req.protocol}://${req.hostname}:${req.client.localPort}/data`)).then(res => res.json())
}

app.get('/', (req, res) => {
	const debug = require('debug')('taskviz')
	getData(req).then(data => {
		debug('Success from /data %O', data)
		res.render('home',  { tasks : data.filter(a => a.date != null && a.context != null) })
	})
		.catch((err) => {
			debug('Error from /data %s', err)
			res.render('error', { error_detail : err })
		})
})

app.get('/calgrid', (req, res) => {
	const debug = require('debug')('taskviz')
	res.render('calgrid')
})

app.get('/viz', (req, res) => {
	const debug = require('debug')('taskviz')
	res.render('vizhome')
})

app.get('/static/:asset', (req, res) => {
  const debug = require('debug')('taskviz:static')
  if (!req.params.asset) { debug('400'); res.status(400).end('Missing asset parameter') }
  else if (!req.params.asset.match('[A-Za-z0-9\.]')) { debug(`400 ${req.params.asset}`); res.status(400).end('Invalid asset name') }
  else {
    res.status(200)
<<<<<<< HEAD
    debug(`Asset param OK, attempting stream of ${req.params.asset}`)
=======
    debug('Asset param OK, attempting stream')
>>>>>>> 567b1d7... Add /static route
    var s = fs.createReadStream(path.format({ dir: process.env.STATIC_PATH, base: req.params.asset }))
    s.on('error', e => {
      if (e.code == 'ENOENT') { debug('404'); res.status(404).end() }
      else { debug(`500 ${err}`); res.status(500).end() }
    })
    s.pipe(res)
  }
})

function getFile(filename) {
	var cachedfile = filecache.get(filename)
	const debug = require('debug')('taskviz:cache')
	if (!cachedfile) {
		debug(`Cache miss on ${filename}`)
		return new Promise((resolve, reject) => {
			dbclient.filesGetTemporaryLink({ path : filename })
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

app.get('/data', (req, res) => {
	const debug = require('debug')('taskviz:api')
	getFile(process.env.DROPBOX_FILEPATH)
		.then(text => {
			debug('Fetch of file success %s', text)
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

app.listen(process.env.PORT)
