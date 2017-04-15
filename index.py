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
    return render_template('index.html')


@app.route('/getTweetsFromCoordinates', methods=['GET'])
def findFunction():
    geocode = request.args#request.form
    lat = geocode.get('lat') #geocode.getlist('lat')[0]
    lng = geocode.get('lng') #geocode.getlist('long')[0]
    radius = geocode.get('radius') #geocode.getlist('radius')[0]
    numWords = geocode.get('numWords') #geocode.getlist('numWords')[0]
    commonWords = geocode.get('commonWords') #geocode.getlist('numWords')[0]

    print(geocode, lat, lng, radius, numWords)

    lat = int(float(lat))
    lng = int(float(lng))
    radius = int(radius)
    numWords = int(numWords)

    tweetList = []

    # up and right
    for i in range(radius):
        for j in range(radius):

            latSearch = lat + i
            lngSearch = lng + j


            if (latSearch > 90):
                latSearch = latSearch - (2*i)

            if (lngSearch > 180):
                lngSearch = -180 + j

            # print(latSearch, lngSearch)

            finder = coordinates.find({"$and": [
                     {"lat": latSearch}, {"long":lngSearch}]})
            tweetList.append(finder.distinct("tweets"))

    # down and left
    for i in range(radius):
        for j in range(radius):

            latSearch = lat - i
            lngSearch = lng - j

            if (latSearch < -90):
                latSearch = latSearch + (2*i)

            if (lngSearch < -180):
                lngSearch = 180 - j

            # print(latSearch, lngSearch)

            finder = coordinates.find({"$and": [
                     {"lat": latSearch}, {"long":lngSearch}]})

            tweetList.append(finder.distinct("tweets"))


    sentenceList = [item for row in tweetList for item in row]
    # print(sentenceList)

    if (len(sentenceList) > 0):
        cv = CountVectorizer()
        x = cv.fit_transform(sentenceList).toarray()
        y = cv.get_feature_names()
        dist = np.sum(x, axis = 0)

        sumWords = 0
        aDict = {}
        bList = []
        for tag,count in zip(y,dist):
            # print (count,tag)
            aDict[tag] = count
            bList.append([tag,int(count)])
            sumWords += count
        finalList = sorted(bList, key = lambda x:x[1], reverse = True)
        wordsList = []
        countsList = []
        for each in finalList:
            wordsList.append(each[0])
            countsList.append(int(each[1]))

    else:
        finalList = []
        wordsList = []
        countsList = []
        sumWords = 0

    if (sumWords > numWords):
        print(finalList[:numWords], wordsList[:numWords], countsList[:numWords], sumWords)

        return jsonify({"finalList":finalList[:numWords], "words": wordsList[:numWords], "counts": countsList[:numWords], "sumWords": int(sumWords)})
    else:
        print("HERE")

        return jsonify({"finalList":finalList, "words": wordsList, "counts": countsList, "sumWords": int(sumWords)})


@app.route('/loadDB')
def loadDB():
    tweet_list = api.search (
        q = '""',
        count = 100,
        lang = "en",
    )

    i = 0
    for tweet in tweet_list:
        lat = random.randint(-91, 90)
        lng = random.randint(-181, 180)

        node = db.coordinates.update({ "lat": lat, "long": lng }, {"$push": {"tweets" : tweet.text}})
        i += 1

    return jsonify({"success": True})


@app.route('/clearDB')
def clearDB():
    coordinates.drop();
    for i in range(-90, 91):
        for j in range(-180, 181):
            post_id = coordinates.insert({"lat": i,"long": j,"tweets":[]})

    return jsonify({"success": True})



if __name__ == '__main__':
    app.run(debug = True)
