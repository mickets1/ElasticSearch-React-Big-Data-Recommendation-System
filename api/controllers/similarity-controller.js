/* eslint-disable jsdoc/require-jsdoc */
import { calculateMovieSimilarity } from '../utils/CalculateMovieRecommendation.js'
import { calculateUserSimilarity } from '../utils/calculateUserSimilarity.js'
import { userBasedMovieRecommendations } from '../utils/userBasedMovieRecommendations.js'

/**
 * Similarity
 */
export class SimilarityController {
  async index (req, res, next) {
    return res.json('Empty')
  }

  async movieRecommendations (req, res, next) {
    const startTime = performance.now()

    const userSimilarities = await calculateUserSimilarity(req, res, next)
    const result = await userBasedMovieRecommendations(req, res, next, userSimilarities)
    const slicedResult = result.slice(0, req.body.num)

    const endTime = performance.now()
    const elapsedTime = (endTime - startTime)
    slicedResult.push({ ExecTimeMs: elapsedTime })

    res.status(200).json(slicedResult)
  }

  async topUsers (req, res, next) {
    const startTime = performance.now()
    // Slice based on number of results wanted by user.
    const result = await calculateUserSimilarity(req, res, next)
    const slicedResult = result.slice(0, req.body.num)

    const endTime = performance.now()
    const elapsedTime = (endTime - startTime)
    slicedResult.push({ ExecTimeMs: elapsedTime })

    res.json(slicedResult)
  }

  async oldMovieRecommendations (req, res, next) {
    const startTime = performance.now()
    // Slice based on number of results wanted by user.
    const result = await calculateMovieSimilarity(req, res, next)
    const slicedResult = result.slice(0, req.body.num)

    const endTime = performance.now()
    const elapsedTime = (endTime - startTime)
    slicedResult.push({ ExecTimeMs: elapsedTime })

    res.status(200).json(slicedResult)
  }
}
