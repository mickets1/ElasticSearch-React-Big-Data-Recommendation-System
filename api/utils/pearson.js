/* eslint-disable jsdoc/require-jsdoc */
export async function pearson (userA, userB) {
  let sum1 = 0
  let sum2 = 0
  let sum1sq = 0
  let sum2sq = 0
  let pSum = 0
  let n = 0

  for (let i = 0; i < userA.hits.hits.length - 1; i++) {
    const uA = userA.hits.hits[i]._source
    const uaRating = parseFloat(uA.Rating)

    for (let j = 0; j < userB.hits.hits.length - 1; j++) {
      const uB = userB.hits.hits[j]._source
      const ubRating = parseFloat(uB.Rating)

      if (uA.MovieId === uB.MovieId) {
        sum1 += uaRating
        sum2 += ubRating
        sum1sq += Math.pow((uaRating), 2)
        sum2sq += Math.pow((ubRating), 2)
        pSum += uaRating * ubRating
        n += 1
      }
    }
  }

  if (n === 0) {
    return 0
  }

  // Calculate Pearson
  const num = pSum - (sum1 * sum2 / n)
  const den = Math.sqrt((sum1sq - sum1 ** 2 / n) * (sum2sq - sum2 ** 2 / n))

  // Avoid zero division and zero similarity
  const similarity = num / den
  if (similarity === 0) {
    return 0
  }

  return num / den
}
