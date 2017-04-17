var mapGlobal;

$(document).ready(function() {
    var returnAjax = $.ajax({
         url: "/onAppLoad",
         dataType: "json",
         async: false
    });

    var count = returnAjax.responseJSON.count
    document.getElementById("numTweets").innerText = count;
    console.log("ready!");
});

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

    try {
        if (!isMap) {

            lat = document.getElementById("lat").value;
            lng = document.getElementById("long").value;
            rad = document.getElementById("radius").value;
            numWords = document.getElementById("numWords").value;

            if (lat == "" || lng == "" || rad == "" || numWords == "") {
                console.log("error - null - not map")
                jQuery.noConflict();
                $('#error').modal('toggle');
                return;
            }

            lat = parseInt(lat);
            lng = parseInt(lng);
            rad = parseInt(rad);
            numWords = parseInt(numWords);
            var positionMap = {lat: lat, lng: lng};

        } else {
            var positionMap = position
            lat = positionMap.lat
            lng = positionMap.lng

            rad = document.getElementById("radius").value;
            numWords = document.getElementById("numWords").value;

            if (rad == "" || numWords == "") {
                console.log("error - null - map")
                jQuery.noConflict();
                $('#error').modal('toggle');
                return;
            }

            rad = parseInt(rad);
            numWords = parseInt(numWords);
        }

        commonWords = $('#switch').prop('checked')

    } catch(err) {
        console.log("error - parsingInt")
        jQuery.noConflict();
        $('#error').modal('toggle');
        return;
    }

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
        // console.log(data);
        if (data.success) {
            $('#loading').modal('hide');
            clearInterval(msId);
            document.getElementById("loadtime").innerText = ms * 4;
            document.getElementById("numTweets").innerText = data.count;
        }
    });
}

function reset() {
    jQuery.noConflict();
    $('#clear').modal({backdrop: 'static', keyboard: false})
}

function deleteDB() {

    $('#passwordNull').hide()

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

    console.log(document.getElementById("deleteDBpassword").value)
    var returnAjax = $.ajax({
         url: "/clearDB",
         data :
             {
                'password': document.getElementById("deleteDBpassword").value
             },
         dataType: "json",
         async: false
    });

    var res = returnAjax.responseJSON

    console.log(res);
    if (res.success) {
        $('#clear').modal('hide');
    } else {
        $('#passwordNull').show()
    }
    $('#deleteLoader').hide()

    clearInterval(msId);
    document.getElementById("resettime").innerText = ms * 4;
    $("#deletebutton").attr("disabled",false);
    $("#deleteClose").attr("disabled",false);
    document.getElementById("numTweets").innerText = res.count;
}


function getTweets(lat, lng, radius, numWords, commonWords) {

    console.log(lat, lng, radius, numWords, commonWords)
    jQuery.noConflict();
    $('#results').modal('toggle');
    $('#resultsLoader').show()
    $('#piechart').hide()
    // $('#resultsTitle').text("Results at (" + lat + ", " + lng + ")")

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

        var resFinalList = returnAjax.responseJSON.finalList
        resFinalList.unshift(['Word', 'Frequency'])

        var dataPie = new google.visualization.arrayToDataTable(resFinalList);
        var optionsPie = {
            'title': 'Pie Chart of Most Occuring Words',
            'width': $(window).width() / 4,
            'height':600
        };

        var chartPie = new google.visualization.PieChart(document.getElementById('pie_single'));
        chartPie.draw(dataPie, optionsPie);

        try {
            $('#mostcommonword').text(resFinalList[1][0] + " - " + resFinalList[1][1]);
        } catch (err) {
            $('#mostcommonword').text('No Tweets Found In This Region.');
        }

        var resEverything = returnAjax.responseJSON.everything
        resEverything.unshift(['Word', 'Frequency', 'Number of Letters','Number of Letters'])

        var dataBubble = new google.visualization.arrayToDataTable(resEverything);
        var optionsBubble = {
            'title': 'Correlation between Frequency of Words and Number of Letters in a word',
            'width': $(window).width() / 4,
            'height':600,
            hAxis: {title: 'Frequency'},
            vAxis: {title: 'Words and Number of Letters'},
            bubble: {textStyle: {fontSize: 11}}
        };

        var chartBubble = new google.visualization.BubbleChart(document.getElementById('bubble_single'));
        chartBubble.draw(dataBubble, optionsBubble);


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

        // console.log(resList)

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
