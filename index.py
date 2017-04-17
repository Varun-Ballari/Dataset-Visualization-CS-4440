from flask import Flask, request, render_template, jsonify
import os
import tweepy
import pymongo
import pprint
import random
import pycountry

from sklearn.feature_extraction.text import CountVectorizer
import numpy as np

from keys import keys

CONSUMER_KEY = os.environ.get('consumer_key') or keys['consumer_key']
CONSUMER_SECRET = os.environ.get('consumer_secret') or keys['consumer_secret']
ACCESS_TOKEN = os.environ.get('access_token') or keys['access_token']
ACCESS_TOKEN_SECRET = os.environ.get('access_token_secret') or keys['access_token_secret']

auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
auth.set_access_token(ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
api = tweepy.API(auth)


app = Flask(__name__)

USERNAME = os.environ.get('username') or keys['username']
PASSWORD = os.environ.get('password') or keys['password']

client = pymongo.MongoClient("mongodb://" + USERNAME + ":" + PASSWORD+ "@cluster0-shard-00-00-99szw.mongodb.net:27017,cluster0-shard-00-01-99szw.mongodb.net:27017,cluster0-shard-00-02-99szw.mongodb.net:27017/admin?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin")
# client = pymongo.MongoClient("localhost", 27017)


db = client.CS4440
coordinates = db.coordinates
countries = db.countries
countTweets = db.countTweets


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
        freqList = []
        numLetter = []
        everything = []
        for each in finalList:
            wordsList.append(each[0])
            freqList.append(int(each[1]))
            numLetter.append(len(each[0]))
            everything.append([each[0], int(each[1]),len(each[0]), len(each[0])])
    else:
        everything = []
        finalList = []
        wordsList = []
        freqList = []
        sumWords = 0

    if (sumWords > numWords):
        # print(finalList[:numWords], wordsList[:numWords], freqList[:numWords], sumWords)

        return jsonify({"everything": everything[:numWords], "finalList":finalList[:numWords], "words": wordsList[:numWords], "frequency": freqList[:numWords], "sumWords": int(sumWords)})
    else:
        # print("HERE")

        return jsonify({"everything": everything, "finalList":finalList, "words": wordsList, "frequency": freqList, "sumWords": int(sumWords)})


@app.route('/loadDB')
def loadDB():
    tweet_list = api.search (
        q = '""',
        count = 100,
        lang = "en",
    )

    ctyList = list(pycountry.countries)

    for tweet in tweet_list:

        # add tweet coordinates list
        lat = random.randint(-91, 90)
        lng = random.randint(-181, 180)
        node = db.coordinates.update({ "lat": lat, "long": lng }, {"$push": {"tweets" : tweet.text}})


        # count increment - countries list

        country = random.choice(ctyList).name

        flag = bool(db.countries.find_one({'country': country}))
        if (flag == False):
            countries.insert_one(
            {
                'country' : country,
                'count' : 1
            })
        else :
            countries.update({
                'country' : country},
                {'$inc' : {'count':int(1)}
            })

        # count increment - countTweets
    countTweets.update_one(
        {},
        {
            '$inc': {'numTweets': int(len(tweet_list))}
        })

    ct = list(countTweets.find({},{'_id': False}))
    # print(ct[0]['numTweets'])

    return jsonify({"success": True, "count": ct[0]['numTweets']})


@app.route('/clearDB')
def clearDB():
    coordinates.drop()
    countries.drop()
    countTweets.drop()

    countTweets.insert_one(
    {
        'numTweets': 0
    })

    for i in range(-90, 91):
        for j in range(-180, 181):
            post_id = coordinates.insert({"lat": i,"long": j,"tweets":[]})

    return jsonify({"success": True, "count" : 0})


@app.route('/countries')
def readCountry():
    cursor = list(countries.find({},{'_id': False}))
    countryList = []

    for i in cursor:
        temp = []
        for key, value in i.items():
            temp.append(value)
        countryList.append(temp)

    # print(countryList)
    return jsonify({"success": True, "countryList" : countryList})

@app.route('/onAppLoad')
def onAppLoad():
    ct = list(countTweets.find({},{'_id': False}))
    return jsonify({"success": True, "count": ct[0]['numTweets']})


if __name__ == '__main__':
    app.run(debug = True)
