from flask import Flask, request, render_template
import os
import tweepy


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

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/getTweetsFromCoordinates', methods=['POST'])
def getTweets():

    geocode = request.form
    latCor = geocode.getlist('lat')[0]
    longCor = geocode.getlist('long')[0]
    radius = geocode.getlist('radius')[0]

    geoCodeSearch = latCor + "," + longCor + "," + radius + "mi"

    print(geoCodeSearch)

    tweet_list = api.search (
        q = '""',
        count = 10,
        lang = "en",
        geocode = geoCodeSearch
    )

    for tweet in tweet_list:
        print(tweet.text)
        if tweet.coordinates is None:
            tweet_list.remove(tweet)

    print(len(tweet_list))

    return 'OK'

if __name__ == '__main__':
    app.run(debug = True)
