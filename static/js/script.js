var mapGlobal;

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function initMap() {
    var myLatLng = {lat: 37.363, lng: -95.044};
    var infoWindow;

    var styledMapType = new google.maps.StyledMapType(

    [

    ],
    {name: 'Styled Map'});

    mapGlobal = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 3,
        mapTypeControlOptions: {
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',
                  'styled_map']
        },
        minZoom: 2,
    });
    infoWindow = new google.maps.InfoWindow;

    mapGlobal.mapTypes.set('styled_map', styledMapType);
    mapGlobal.setMapTypeId('styled_map');

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            infoWindow.open(mapGlobal);
            mapGlobal.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, mapGlobal.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, mapGlobal.getCenter());
    }

    mapGlobal.addListener('click', function(e) {
        placeMarker(true, e.latLng);
    });


}

function placeMarker(isMap, position) {
    var color = getRandomColor()

    // try {
    if (!isMap) {
        lat = parseInt(document.getElementById("lat").value);
        lng = parseInt(document.getElementById("long").value);
        var positionMap = {lat: lat, lng: lng};
    } else {
        var positionMap = position
        lat = positionMap.lat
        lng = positionMap.lng
    }
    rad = parseInt(document.getElementById("radius").value);
    numWords = parseInt(document.getElementById("numWords").value);
    commonWords = $('#switch').prop('checked')

    // } catch(err) {
    //     console.log("error - parsingInt")
    //     jQuery.noConflict();
    //     $('#error').modal('toggle');
    //     return;
    // }

    var marker = new google.maps.Marker({
        position: positionMap,
        map: mapGlobal
    });

    mapGlobal.panTo(positionMap);

    var cityCircle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        map: mapGlobal,
        center: positionMap,
        radius: rad * 1000 * 111
    });

    getTweets(lat, lng, rad, numWords, commonWords);
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(mapGlobal);
}


function load() {
    jQuery.noConflict();
    $('#loading').modal({backdrop: 'static', keyboard: false})

    var ms = 0;
    var sec = 0;
    var msId = window.setInterval(function() {
        ms++;
        sec = Math.floor(ms * 4 / 1000)
        document.getElementById("count-up").innerText = sec;
    }, 1);

    $.get("/loadDB", function(data) {
        console.log(data);
        if (data.success) {
            $('#loading').modal('hide');
            clearInterval(msId);
            document.getElementById("loadtime").innerText = ms * 4;
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

    var ms = 0;
    var sec = 0;
    var msId = window.setInterval(function() {
        ms++;
        sec = Math.floor(ms * 4 / 1000)
        document.getElementById("delete-count-up").innerText = sec;
    }, 1);


    $.get("/clearDB", function(data) {
        console.log(data);
        if (data.success) {
            $('#clear').modal('hide');
            clearInterval(msId);
            document.getElementById("resettime").innerText = ms * 4;

        }
    });
}

function getTweets(lat, lng, radius, numWords, commonWords) {
    console.log("HT")
    jQuery.noConflict();
    $('#results').modal('toggle');
    $('#resultsLoader').show()
    $('#piechart').hide()

    var ms = 0;
    var sec = 0;
    var msId = window.setInterval(function() {
        ms++;
        sec = Math.floor(ms * 4 / 1000)
        document.getElementById("results-count-up").innerText = sec;
    }, 1);


    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var returnAjax = $.ajax({
             url: "/getTweetsFromCoordinates",
             data :
                 {
                     "lat": lat,
                     "lng": lng,
                     "radius": radius,
                     "numWords": numWords,
                     "commonWords": commonWords
                 },
             dataType: "json",

             async: false
        });

        var resList = returnAjax.responseJSON.finalList
        resList.unshift(['Word', 'Frequency'])

        console.log(resList)

        // resList.unshift(['Word', 'Frequency'])
        var data = new google.visualization.arrayToDataTable(resList);
        var options = {
            'title': 'Pie Chart of Most Occuring Words',
            'width': $(window).width() / 2,
            'height':900
        };

        var chart = new google.visualization.PieChart(document.getElementById('pie_single'));
        chart.draw(data, options);

        $('#resultsLoader').css('display','none')
        $('#piechart').show()
        clearInterval(msId);
        document.getElementById("searchtime").innerText = ms * 4;
    }
}

function countries() {
    google.charts.load('current', {'packages':['geochart']});
    google.charts.setOnLoadCallback(drawRegionsMap);

    function drawRegionsMap() {
        var returnAjax = $.ajax({
             url: "/countries",
             dataType: "json",
             async: false
        });

        var resList = returnAjax.responseJSON.countryList
        resList.unshift(['Country', 'Number of Tweets'])

        console.log(resList)

        var data = new google.visualization.arrayToDataTable(resList);

        var options = {
            colorAxis: {colors: ['#ffffff','#157BFB']},
        };

        var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));

        chart.draw(data, options);
    }

    jQuery.noConflict();
    $('#countries').modal('toggle');
}
