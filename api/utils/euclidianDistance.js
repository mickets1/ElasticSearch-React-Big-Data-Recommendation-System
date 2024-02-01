/* eslint-disable jsdoc/require-jsdoc */
export async function euclideanDistance (userA, userB) {
  let sim = 0
  let n = 0

  for (let i = 0; i < userA.hits.hits.length - 1; i++) {
    const uArating = userA.hits.hits[i]._source

    for (let j = 0; j < userB.hits.hits.length - 1; j++) {
      const uBrating = userB.hits.hits[j]._source

      if (uArating.MovieId === uBrating.MovieId) {
        sim += Math.pow((uArating.Rating - uBrating.Rating), 2)
        n += 1
      }
    }
  }

  if (n === 0) {
    return 0
  }

  const inv = 1 / (1 + sim)

  return inv
}

export async function sort (userMatches) {
  userMatches.sort(function (a, b) {
    return a.simScore - b.simScore
  })

  return userMatches.reverse()
}
