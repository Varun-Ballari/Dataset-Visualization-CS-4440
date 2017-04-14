from flask import Flask, request, render_template, jsonify
import os
import tweepy
import pymongo
from pymongo import MongoClient
import pprint
import random

from sklearn.feature_extraction.text import CountVectorizer
import numpy as np


keys = {
    'consumer_key': 'bcrYegc5EJtupdfL9e8TPQ5LK',
    'consumer_secret': 'woW7Ny8ukLcaaAkn6UHann36q4kOTo8dhpFbE1dc6UmDYZ3BRn',
    'access_token': '190970246-NXuSdEZoEJeC1a9gUlRvkcS5u6mAOub7UZu1PZH0',
    'access_token_secret': 'jcOlJZc7lbTDbpCqcnG3zu2IMhxWImiNXKblHfFVNHGm8',
}


CONSUMER_KEY = keys['consumer_key'] #os.environ.get('consumer_key')
CONSUMER_SECRET = keys['consumer_secret'] #os.environ.get('consumer_secret')
ACCESS_TOKEN = keys['access_token'] #os.environ.get('access_token')
ACCESS_TOKEN_SECRET = keys['access_token_secret'] #os.environ.get('access_token_secret')

auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
auth.set_access_token(ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
api = tweepy.API(auth)


app = Flask(__name__)
client = pymongo.MongoClient("localhost", 27017)
db = client.CS4440
coordinates = db.coordinates

@app.route('/')
def index():

    # pp = pprint.PrettyPrinter(indent=4)
    #
    # cur = coordinates.find()
    #
    # pp.pprint(cur)
    #
    # for doc in cur:
    #     pp.pprint(doc)

    return render_template('index.html')


# @app.route('/getTweetsFromCoordinates', methods=['POST'])
# def getTweets():
#     geocode = request.form
#     latCor = geocode.getlist('lat')[0]
#     longCor = geocode.getlist('long')[0]
#     radius = geocode.getlist('radius')[0]
#
#     geoCodeSearch = latCor + "," + longCor + "," + radius + "mi"
#
#     print(geoCodeSearch)
#
#     tweet_list = api.search (
#         q = '""',
#         count = 10,
#         lang = "en",
#         geocode = geoCodeSearch
#     )
#
#     for tweet in tweet_list:
#         print(tweet.text)
#
#     return jsonify({"success": True})

@app.route('/getTweetsFromCoordinates', methods=['POST'])
def findFunction():
    geocode = request.form
    lat = geocode.getlist('lat')[0]
    lon = geocode.getlist('long')[0]
    radius = geocode.getlist('radius')[0]
    numWords = geocode.getlist('numWords')[0]

    lat = int(lat)
    lon = int(lon)
    radius = int(radius)
    numWords = int(numWords)

    aList = []
    finder = coordinates.find({"$and": [
             {"lat": lat}, {"long":lon}]})

    finder2 = coordinates.find({"$and": [
                 {"lat": lat + radius}, {"long":lon + radius}]})

    finder3 = coordinates.find({"$and": [
             {"lat": lat - radius}, {"long":lon - radius}]})

    finder4 = coordinates.find({"$and": [
                 {"lat": lat + radius}, {"long":lon - radius}]})

    finder5 = coordinates.find({"$and": [
                 {"lat": lat - radius}, {"long":lon + radius}]})
    # print(finder.distinct("tweet"))
    # with open(filename,"w") as f:
    aList.append(finder.distinct("tweets"))
    aList.append(finder2.distinct("tweets"))
    aList.append(finder3.distinct("tweets"))
    aList.append(finder4.distinct("tweets"))
    aList.append(finder5.distinct("tweets"))
    sentenceList = [item for row in aList for item in row]
    # sum(aList,[])
    # print(sentenceList)
    # print(aList)
    cv = CountVectorizer()
    x = cv.fit_transform(sentenceList).toarray()
    y = cv.get_feature_names()
    dist = np.sum(x, axis = 0)

    sumwords = 0
    aDict = {}
    bList = []
    for tag,count in zip(y,dist):
        # print (count,tag)
        aDict[tag] = count
        bList.append([tag,count])
        sumwords += count
    finalList = sorted(bList, key = lambda x:x[1], reverse = True)
    wordsList = []
    countsList = []
    for each in finalList:
        wordsList.append(each[0])
        countsList.append(int(each[1]))
    print(wordsList[:numWords])
    print(countsList[:numWords])
    print(sumwords)



    return jsonify({"words": wordsList[:numWords], "counts": countsList[:numWords], "sumwords": int(sumwords})


@app.route('/loadDB')
def loadDB():
    tweet_list = api.search (
        q = '""',
        count = 100,
        lang = "en",
    )

    i = 0
    for tweet in tweet_list:
        lat = -180#random.randint(-181, 180)
        lon = -180#random.randint(-181, 180)
        # print(lat, lon)

        node = db.coordinates.update({ "lat": lat, "long": lon }, {"$push": {"tweets" : tweet.text}})
        i += 1

    print(i)
    return jsonify({"success": True})


@app.route('/clearDB')
def clearDB():
    # coordinates.drop();
    # for i in range(-180, 181):
    #     for j in range(-180, 181):
    #         post_id = coordinates.insert({"lat": i,"long": j,"tweets":[]})

    return jsonify({"success": True})



if __name__ == '__main__':
    app.run(debug = True)
