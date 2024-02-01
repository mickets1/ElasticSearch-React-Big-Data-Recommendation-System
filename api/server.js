import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { Client } from '@elastic/elasticsearch'
import { router } from './routes/router.js'
import fs from 'fs-extra'

const app = express()
// Place cors before router
app.use(cors())
app.use(express.json())
app.use('/', router)

/**
 * Express middleware for communicating with elasticsearch
 */
const client = new Client({
  node: 'https://localhost:9200',
  auth: { username: process.env.USERNAME, password: process.env.PASSWORD },
  tls: {
    ca: fs.readFileSync('./http_ca.crt'),
    rejectUnauthorized: false
  },
  log: 'info',
  apiVersion: '8.1.2'
})
app.es = client

app.listen(8000, () => {
  console.log('Server running at http://localhost:8000')
  console.log('Press Ctrl-C to terminate...')
})
