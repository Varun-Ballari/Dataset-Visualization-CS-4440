function initMap() {
    var myLatLng = {lat: 37.363, lng: -95.044};
    var map, infoWindow;

    var styledMapType = new google.maps.StyledMapType(

    [

    ],
    {name: 'Styled Map'});



    map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 3,
        mapTypeControlOptions: {
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',
                  'styled_map']
        }
    });
    infoWindow = new google.maps.InfoWindow;

    map.mapTypes.set('styled_map', styledMapType);
    map.setMapTypeId('styled_map');

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

function search() {
    lat = document.getElementById("lat").value;
    lon = document.getElementById("long").value;
    rad = document.getElementById("radius").value;

    if (lat == "" || long == "" || rad == "") {
        console.log("error")
        jQuery.noConflict();
        $('#error').modal('toggle');
    } else {
        console.log(lat, lon, rad)

        getTweets(parseInt(lat), parseInt(lon), parseInt(rad), 5);
    }

}

function load() {
    jQuery.noConflict();
    $('#loading').modal({backdrop: 'static', keyboard: false})
    var sec = 0;

    var counterId = setInterval(function() {
        sec++;
        document.getElementById("count-up").innerText = sec;
    }, 1000);

    $.get("/loadDB", function(data) {
        console.log(data);
        if (data.success) {
            $('#loading').modal('hide');
        }
    });
}

function reset() {
    jQuery.noConflict();
    $('#clear').modal({backdrop: 'static', keyboard: false})
}

function deleteDB() {
    console.log("deleting")
    $('#deleteLoader').show()
    $("#deletebutton").attr("disabled",true);
    $("#deleteClose").attr("disabled",true);

    var sec = 0;
    var counterId = setInterval(function() {
        sec++;
        document.getElementById("delete-count-up").innerText = sec;
    }, 1000);

    $.get("/clearDB", function(data) {
        console.log(data);
        if (data.success) {
            $('#clear').modal('hide');
        }
    });
}

function getTweets(lat, lon, radius, numWords) {
    $.post("/getTweetsFromCoordinates", {
        "lat": lat,
        "long": lon,
        "radius": radius,
        "numWords": numWords
    },function(data) {
        console.log(data)
    });
}

function countries() {
    google.charts.load('current', {'packages':['geochart']});
    google.charts.setOnLoadCallback(drawRegionsMap);

    function drawRegionsMap() {

        var data = google.visualization.arrayToDataTable([
          ['Country', 'Popularity'],
          ['Germany', 200],
          ['United States', 300],
          ['Brazil', 400],
          ['Canada', 500],
          ['France', 600],
          ['RU', 700]
        ]);

        var options = {

            colorAxis: {colors: ['#ffffff','#157BFB']},
        };

        var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));

        chart.draw(data, options);
    }

    jQuery.noConflict();
    $('#countries').modal('toggle');


}
