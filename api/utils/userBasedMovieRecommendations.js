import { getMovies } from './CalculateMovieRecommendation.js'

/**
 * Generate user-based movie recommendations.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @param {Array} userSimilarities - Array of user similarity objects.
 * @returns {Array} - Array of movie recommendations.
 */
export async function userBasedMovieRecommendations (req, res, next, userSimilarities) {
  const user = await req.app.es.search({
    size: 10000,
    index: 'docker',
    query: {
      match: { UserId: parseInt(req.body.userId) }
    }
  })

  const allMovies = await getMovies(req, res, next)

  // if user doesn't select min num ratings...
  if (!req.body.numRatings) {
    req.body.numRatings = 5
  }

  // Exclude movies with few ratings and store relevant info into a "movie map".
  const movieMap = {}
  for (const movie of allMovies) {
    if (movie.key.NumRatings >= req.body.numRatings) {
      movieMap[movie.key.MovieId] = {
        Title: movie.key.Title,
        NumRatings: movie.key.NumRatings
      }
    }
  }

  // Ids of the movies the user has rated.
  const moviesRatedByUser = []
  for (const ratedMovie of user.hits.hits) {
    moviesRatedByUser.push(ratedMovie._source.MovieId)
  }

  const movieRecommendations = []
  const recommendedMoviesSet = new Set()
  for (const similarUser of userSimilarities) {
    const similarUserMovies = await req.app.es.search({
      size: 10000,
      index: 'docker',
      query: {
        match: { UserId: parseInt(similarUser.userId) }
      }
    })

    const m = similarUserMovies.hits.hits.length
    for (let i = 0; i < m; i++) {
      const movieId = similarUserMovies.hits.hits[i]._source.MovieId
      for (let j = 0; j < moviesRatedByUser.length; j++) {
        // If the user hasn't already seen the movie.
        // As multiple users has seen the same movie, this also excludes duplicates.
        if (movieId !== moviesRatedByUser[j] && !recommendedMoviesSet.has(movieId)) {
          recommendedMoviesSet.add(movieId)
          movieRecommendations.push({ movieid: movieId, userid: similarUser.userId, simScore: similarUser.simScore })
          break
        }
      }
    }
  }

  const movieResult = []
  // Parse final result
  for (let i = 0; i < movieRecommendations.length; i++) {
    const movieId = movieRecommendations[i].movieid
    const userId = movieRecommendations[i].userid
    const simScore = movieRecommendations[i].simScore

    // Since we exclude some movies(numratings) we need to check if movieId exist.
    if (movieMap[movieId]) {
      const movieTitle = movieMap[movieId].Title
      const numRating = movieMap[movieId].NumRatings
      movieResult.push({ movieid: movieId, userid: userId, movietitle: movieTitle, numrating: numRating, simscore: simScore })
    }
  }

  return movieResult
}
