import csv
import json
from elasticsearch import helpers, Elasticsearch
from dotenv import load_dotenv
import os

load_dotenv()

# ratings.csv need to be first to calculate numRatings properly
filenames = ["datasets/ratings.csv", "datasets/movies.csv"]
indexName = "docker"

es = Elasticsearch(hosts=os.environ["host"],
ssl_assert_fingerprint=os.environ["ssl_assert_fingerprint"])

numRatings = {}
def csv_reader(file):
  try:
    with open(file, 'r') as outfile:
      reader = csv.DictReader(outfile, delimiter=',')
      rows = list(reader)
      
      if "ratings.csv" in file:
        for row in rows:
          movieId = row["MovieId"]
          numRatings[movieId] = numRatings.get(movieId, 0) + 1

      if "movies.csv" in file:
        for row in rows:
          movieId = row["MovieId"]
          row["numRatings"] = numRatings.get(movieId, 0)

      helpers.bulk(es, rows, index=indexName)
  except Exception as e:
    print("Error", e)
  
def deleteDocuments():
  es.delete_by_query(index=indexName, body={"query": {"match_all": {}}})
  print("Documents Deleted From", indexName)

# Delete all documents - start over.
#deleteDocuments()

for file in filenames:
  csv_reader(file)