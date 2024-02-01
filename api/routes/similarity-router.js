import express from 'express'
import { SimilarityController } from '../controllers/similarity-controller.js'

export const router = express.Router()
const similarityController = new SimilarityController()

router.get('/', (req, res, next) => similarityController.index(req, res, next))
router.get('/users', (req, res, next) => similarityController.users(req, res, next))
router.post('/topusers', (req, res, next) => similarityController.topUsers(req, res, next))
router.post('/movierecommendations', (req, res, next) => similarityController.movieRecommendations(req, res, next))
