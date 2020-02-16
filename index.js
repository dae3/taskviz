'use strict';
require('dotenv').config();
const Dropbox = require('dropbox').Dropbox
const fetch = require('node-fetch')
const debug = require('debug')('taskviz')
const todo = require('todotxt-parser')
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
					const tasks = todo.relaxed(text)
					debug('Task parsing done %O', tasks)
					res.render('home',  { tasks : tasks })
				})
				.catch((error) => {
					debug('Fetch of temp link failed %O', error)
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
