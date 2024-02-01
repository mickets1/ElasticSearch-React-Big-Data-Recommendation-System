import express from 'express'
import createError from 'http-errors'
import { router as similarity } from './similarity-router.js'

export const router = express.Router()

router.use('/', similarity)
router.use('*', (req, res, next) => next(createError(404)))

// Catch 404 (ALWAYS keep this as the last route).
