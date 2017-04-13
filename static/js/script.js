function initMap() {
    var myLatLng = {lat: 37.363, lng: -95.044};
    var map, infoWindow;
    map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 3
    });
    infoWindow = new google.maps.InfoWindow;

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            infoWindow.open(map);
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }


    map.addListener('click', function(e) {
        placeMarker(e.latLng, map);
    });

    function placeMarker(position, map) {
        var marker = new google.maps.Marker({
            position: position,
            map: map
        });
        map.panTo(position);

        var lat = marker.getPosition().lat();
        var long = marker.getPosition().lng();
        getTweets(lat, long, 50);
    }

}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function getTweetsFromButton() {
    lat = document.getElementById("lat").value;
    long = document.getElementById("long").value;
    rad = document.getElementById("radius").value;

    console.log(lat, long, rad)

    getTweets(lat, long, rad);
}

function getTweets(lat, long, radius) {
    console.log(lat, long);

    $.post("/getTweetsFromCoordinates", {
        "lat": lat,
        "long": long,
        "radius": radius
    },function(data) {
        console.log(data)
    });
}
