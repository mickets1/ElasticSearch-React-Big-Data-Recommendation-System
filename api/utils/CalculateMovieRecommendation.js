/* eslint-disable jsdoc/require-jsdoc */
import { calculateUserSimilarity } from './calculateUserSimilarity.js'

export async function calculateMovieSimilarity (req, res, next) {
  const simscores = await calculateUserSimilarity(req, res, next)
  const calcws = await calcWeightedScore(simscores, req, res, next)
  const calcWeightedScoreSum = await calculateWeightedScoreSum(calcws)

  for (let i = 0; i < calcWeightedScoreSum.length; i++) {
    calcWeightedScoreSum[i].simSum = 0

    for (let j = 0; j < simscores.length; j++) {
      for (let k = 0; k < calcWeightedScoreSum[i].seenBy.length; k++) {
        if (simscores[j].userId === calcWeightedScoreSum[i].seenBy[k]) {
          calcWeightedScoreSum[i].simSum += simscores[j].simScore
        }
      }
    }
  }

  return await movieRecommendation(calcWeightedScoreSum)
}

async function movieRecommendation (similarities) {
  for (let i = 0; i < similarities.length; i++) {
    similarities[i].recScore = (similarities[i].weightedScoreSum / similarities[i].simSum).toFixed(4)
  }

  similarities.sort(function (a, b) {
    return a.recScore - b.recScore
  })

  return similarities.reverse()
}

export async function calcWeightedScore (simscores, req, res, next) {
  const allRatings = await getRatings(req, res, next)
  const allMovies = await getMovies(req, res, next)

  // Filter movies with few ratings
  const filteredMovies = []
  for (const movie of allMovies) {
    if (movie.key.NumRatings >= req.body.numRatings) {
      filteredMovies.push(movie)
    }
  }

  // Remove movies user has already seen
  for (let i = 0; i < allRatings.length; i++) {
    for (let j = 0; j < filteredMovies.length; j++) {
      // If user and movieid match rating of a filtered movie.
      if (req.body.userId === allRatings[i].key.UserId && allRatings[i].key.MovieId === filteredMovies[j].key.MovieId) {
        if (allRatings[i].key.MovieId === filteredMovies[j].key.MovieId) {
          filteredMovies.splice(j, 1)
          // break if user has already seen the movie.
          break
        }
      }
    }
  }

  const weightedscores = []
  for (let i = 0; i < filteredMovies.length; i++) {
    for (let j = 0; j < simscores.length; j++) {
      // exclude zero or negative similarity
      if (simscores[j].simScore > 0) {
        for (const e of allRatings) {
          // compare user ids
          if (e.key.UserId === simscores[j].userId) {
            // compare movie ids
            if (e.key.MovieId === filteredMovies[i].key.MovieId) {
              const weight = e.key.Rating * simscores[j].simScore
              weightedscores.push({
                userId: simscores[j].userId,
                name: simscores[j].name,
                movieId: e.key.MovieId,
                movieTitle: filteredMovies[i].key.Title,
                weightScore: weight,
                numRatings: filteredMovies[i].key.NumRatings
              })
            }
          }
        }
      }
    }
  }

  return weightedscores
}

export async function calculateWeightedScoreSum (weightScores) {
  const weightSum = []
  let seenBy = []

  let sum = 0
  let prevMovieId = null
  let prevMovieTitle = null

  for (const curr of weightScores) {
    const score = parseFloat(curr.weightScore)
    const id = curr.userId

    if (curr.movieId === prevMovieId || sum === 0) {
      seenBy.push(id)
      sum += score
    } else {
      weightSum.push({ movieId: prevMovieId, movieTitle: prevMovieTitle, weightedScoreSum: sum, seenBy, numRatings: curr.numRatings })
      seenBy = []
      seenBy.push(id)
      sum = 0
      sum += score
    }

    // Ensure last sum gets pushed.
    if (weightScores.indexOf(curr) === weightScores.length - 1) {
      weightSum.push({ movieId: curr.movieId, movieTitle: curr.movieTitle, weightedScoreSum: sum, seenBy, numRatings: curr.numRatings })
    }

    prevMovieId = curr.movieId
    prevMovieTitle = curr.movieTitle
  }

  return weightSum
}

// Changed to include numRatings
// https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-composite-aggregation.html
export async function getMovies (req, res, next) {
  const pageSize = 1000
  // First set of aggregations.
  const initialResponse = await req.app.es.search({
    size: 0,
    aggs: {
      docker: {
        composite: {
          size: pageSize,
          sources: [
            { MovieId: { terms: { field: 'MovieId.keyword' } } },
            { Title: { terms: { field: 'Title.keyword' } } },
            { NumRatings: { terms: { field: 'numRatings' } } }
          ]
        }
      }
    }
  })

  let buckets = initialResponse.aggregations.docker.buckets
  let results = buckets

  // Continue fetching results using Elasticsearch scroll API until all data is retrieved.
  while (buckets.length === pageSize) {
    const lastBucket = buckets[buckets.length - 1].key

    // Use pagination to retrieve the rest of the results.
    const scrollResponse = await req.app.es.search({
      size: 0,
      aggs: {
        docker: {
          composite: {
            size: pageSize,
            sources: [
              { MovieId: { terms: { field: 'MovieId.keyword' } } },
              { Title: { terms: { field: 'Title.keyword' } } },
              { NumRatings: { terms: { field: 'numRatings' } } }
            ],
            after: lastBucket
          }
        }
      }
    })

    buckets = scrollResponse.aggregations.docker.buckets
    results = results.concat(buckets)
  }

  return results
}

export async function getRatings (req, res, next) {
  const pageSize = 1000

  const initialResponse = await req.app.es.search({
    size: 0,
    aggs: {
      docker: {
        composite: {
          size: pageSize,
          sources: [
            { UserId: { terms: { field: 'UserId.keyword' } } },
            { MovieId: { terms: { field: 'MovieId.keyword' } } },
            { Rating: { terms: { field: 'Rating.keyword' } } }
          ]
        }
      }
    }
  })

  let buckets = initialResponse.aggregations.docker.buckets
  let results = buckets

  while (buckets.length === pageSize) {
    const lastBucket = buckets[buckets.length - 1].key

    const scrollResponse = await req.app.es.search({
      size: 0,
      aggs: {
        docker: {
          composite: {
            size: pageSize,
            sources: [
              { UserId: { terms: { field: 'UserId.keyword' } } },
              { MovieId: { terms: { field: 'MovieId.keyword' } } },
              { Rating: { terms: { field: 'Rating.keyword' } } }
            ],
            after: lastBucket
          }
        }
      }
    })

    buckets = scrollResponse.aggregations.docker.buckets
    // Concat the array results.
    results = results.concat(buckets)
  }

  return results
}
