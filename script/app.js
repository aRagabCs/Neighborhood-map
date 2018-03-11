var locations = [
    // locations listings that will be shown to the user.
  { title: 'Egyptian Museum', location: { lat: 30.047847, lng: 31.233649 } },
  { title: 'Cairo Opera House', location: { lat: 30.042668, lng: 31.223988 } },
  { title: 'Cairo Tower', location: { lat: 30.045915, lng: 31.22429 } },
  { title: 'Tahrir Square', location: { lat: 30.044069, lng: 31.235512 } },
  { title: 'El-Ahly Club', location: { lat: 30.044876, lng: 31.222396 } },
  { title: 'The Nile Ritz Carlton Cairo', location: { lat: 30.045972, lng: 31.232206 } }
];

// google maps initialization
var map;

// Create a new blank array for all the listing markers.
var markers = ko.observableArray([]);

function initMap() {
    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30.044069, lng: 31.235512 },
        zoom: 16
    });

    largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();


    // Create an onclick event to open an infowindow at each marker.
    var markerListener = function (marker) {
        marker.addListener('click', function () {
            this.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () { marker.setAnimation(null); }, 750);
            populateInfoWindow(this, largeInfowindow);
        });
    };
    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;

        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i,
        });

        // Push the marker to our array of markers.
        markers.push(marker);
        locations[i].marker = marker;
        markerListener(marker);

        bounds.extend(marker.position);
    }
    
        map.fitBounds(bounds);
    // Extend the boundaries of the map for each marker
    google.maps.event.addDomListener(window, 'resize', function() {
        map.fitBounds(bounds);
    });
   
}

// populates the infowindow when the marker is clicked.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        

        nytimes = function () {
            //calling nytimes api
            var url = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
            url += '?' + $.param({
                'api-key': "cd45b3de7e4542afa8aaa835e2a53e62",
                'q': marker.title,
                'page': 0,
            });
            $.ajax({
                url: url,
                method: 'GET',

            }).done(function (data) {
                
                articlesNYT(data.response.docs[0]);
                
            }).fail(function (err) {
                alert("NYtimes request failed");
            });
        };
        nytimes();

        //retreving more info from wikipedia using wikipedia API
        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';
        infowindow.setContent('');
        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",

            success: function (response) {
                var articleList = response[3][0];
                if (articleList === undefined) {
                    infowindow.setContent('<div>' + marker.title + '</div>' + '<div class="not-found">wiki page not avaiable</div>');
                }
                else {
                    var link = articleList;
                    infowindow.setContent('<div>' + marker.title + '</div>' + '<div><a target=_blank href=' + link + ">More info" + '</a></div>');
                }

            }
        }).fail(function (err) {
            alert("wiki request failed");
        });
        infowindow.open(map, marker);


        // Make sure the marker property is cleared if the infowindow is closed and delete nytimes articles.
        infowindow.addListener('closeclick', function () {
            infowindow.setMarker = null;
            articlesNYT([]);
        });




    }
}


function mapError() {
    alert("Error showing the map");
}

//viewmodel
var viewModel = function () {
    var self = this;
    // creating observable array from the locations
    self.locations = ko.observableArray(locations);
    self.filter = ko.observable('');
    articlesNYT = ko.observable();   

    // filter locations based on input
    self.filterLocations = ko.computed(function () {
        return ko.utils.arrayFilter(self.locations(), function (loc) {
            if (loc.title.toLowerCase().indexOf(self.filter().toLowerCase()) !== -1) {
                if (loc.marker)
                    loc.marker.setVisible(true);
            } else {
                if (loc.marker)
                    loc.marker.setVisible(false);
            }
            return loc.title.toLowerCase().indexOf(self.filter().toLowerCase()) !== -1;
        });
    }, self);


    

    //click handler for any location click which will open its marker infowindow
    self.clickHandler = function (clickedLocation) {
        populateInfoWindow(clickedLocation.marker, largeInfowindow);
        clickedLocation.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () { clickedLocation.marker.setAnimation(null); }, 750);

        
        nytimes();
    };

   

};

// apply knockout bindings
ko.applyBindings(new viewModel());
