angular.module('hikexpert.home', [])
.controller('HomePageController', function($scope, $rootScope, Home){
  $scope.userInfo = {}; 
  $scope.loading = true;
  $scope.getting_markers = false;
  $scope.markers = [];
  $scope.hikerStatus = 'City-Dweller';
  /////////////// PROGRESS BARS ////////////////////////////////
  //Makes it so numerator cannot exceed denom in progress bar
  $scope.maxFilter = function(current, max){
    if(current > max){
      return max;
    }
    return current;
  };
  //Checks hike count and changes hiker status based on # of hikes
  var updateStatus = function(){
    var hikes = $scope.userInfo.haveDone.length;
    if(hikes >= 100){
      $scope.hikerStatus = 'Explorer';
    } else if(hikes >= 25){
      $scope.hikerStatus = 'Hiker';
    } else if(hikes >= 5){
      $scope.hikerStatus = 'Wanderer';
    }
  };
  //Given target bar in the form '#barID', hikeTarget as an integer, and total hikes
  //Fills target bar the appropriate percent or 100% if total exceeds target
  var fillBar = function(targetBar, hikeTarget, totalHikes){
    var barLength = (totalHikes / hikeTarget * 100).toString() + '%';
    if(totalHikes < hikeTarget){
      $(targetBar).css('width', barLength);
    } else{
      $(targetBar).css('width', '100%');
    }
    updateStatus();
  };
  /////////////// END PROGRESS BARS ////////////////////////////////

  ///// Get user's name and trails upon load
  $scope.getUser = function(){
    Home.getUser()
    .then (function (data) {
      $scope.userInfo.username = data.username;
      $scope.userInfo.haveDone = data.haveDone;
      $scope.userInfo.wantToDo = data.wantToDo;
      
      //set progress bar lengths
      var hikes = $scope.userInfo.haveDone.length;
      var barLength = (hikes / 5 * 100).toString() + '%';
      fillBar('#hikeFive', 5, hikes);
      fillBar('#hikeTwentyFive', 25, hikes);
      fillBar('#hikeHundred', 100, hikes);
    })
    .catch(function (err) {
      console.log('error in getUser', err);
    });
  };
  //////// Call getUser to bring down user's info from DB ///

  $scope.getUser();
  //////// trailPost is defined in services.js
  $scope.trailPost = Home.trailPost;
  /////// moves trails from 'want to do' array to 'have done' array
  $scope.moveTrail = function (trailName, url) {
    Home.trailPost(trailName, url)
    .then(function (response) {
      if(response) {
        // Update view with the new information
        $scope.getUser();
      }
    });
  };

  /// Icons for map, uses leaflet-awesome-markers library ///
  var mapMarker = L.AwesomeMarkers.icon({
    icon: 'map-marker',
    iconColor: 'red' //#F0F0C9
  });
  var yellowIcon = L.AwesomeMarkers.icon({
    icon: 'tree-conifer',
    iconColor: '#C6C013'
  });
  /// This one needed to be bound to $scope b/c it is called in homepage.html
  $scope.greenIcon = L.AwesomeMarkers.icon({
    icon: 'tree-conifer',
    iconColor: '#008148'
  });
  

/// getCoords function /////////////
/// empties out the map, sends user's info to the server, gets API data, uses that data to re-render the icons on the map ///
  $scope.getCoords = function(userInfo){
    $scope.getting_markers = true;
    // Every time this function is called, we re-render the map
    // This removes all the old info and empties out our markers array  
    $scope.markers.forEach(function (marker) {
      $scope.map.removeLayer(marker);
      $scope.markers = [];
  });
    // Get users coordinates from the browser:
    navigator.geolocation.getCurrentPosition(function(position) {
        $scope.userInfo.lat = position.coords.latitude;
        $scope.userInfo.long = position.coords.longitude;
        // Send them to the server:
        Home.getCoords(userInfo)
        .then(function(data){
          // data is a bunch of trail objects from the API
          data.forEach(function(trail, i){
            var marker;
            // We iterate through these objects and decide what kind of icon to display based on the trails presence in our arrays in the DB

            // If it is in the haveDone array, makes its class 'want-to', gives it the greenIcon, and gives option 'I want to hike again'
            if ( $scope.userInfo.haveDone.indexOf(trail.name) > -1 ) {
              marker = L.marker(trail.coordinates, {icon: $scope.greenIcon})
                .bindPopup('<b>'+trail.name+'</b><br /><a class="want-to">I want to hike this again<span class="hidden">'+
                  trail.name+'</span></a><br /><a href="/#/info" class="get-info">Click for more info</a>').addTo($scope.map).openPopup();
              // L.marker will not take more than two parameters ... !?
              // So title is set here:
              marker.options.title = trail.name;
            } 
            // If it is in the wantToDo array, makes its class be 'have', gives it the yellowIcon, and give option 'i have hiked this'
            // If it is in BOTH arrays, this sets the icon to yellow so they can say they have hiked it (again)
            if ( $scope.userInfo.wantToDo.indexOf(trail.name) > -1 ) {
              marker = L.marker(trail.coordinates, {icon: yellowIcon})
                .bindPopup('<b>'+trail.name+'</b><br /><a class="have">I have hiked this<span class="hidden">'+
                  trail.name+'</span></a><br /><a href="/#/info" class="get-info">Click for more info</a>').addTo($scope.map).openPopup();
              // L.marker will not take more than two parameters ... !?
              // So title is set here:
              marker.options.title = trail.name;

            }
            // If it's not in either array, keep it default blue icon
            if ( $scope.userInfo.wantToDo.indexOf(trail.name) === -1 && $scope.userInfo.haveDone.indexOf(trail.name) === -1) {
              marker = L.marker(trail.coordinates, {title: trail.name})
              // This is part of an ugly jQuery hack. Hidden spans contain the name of the trail, so we can get at that later. Undoubtedly, there is a better way to do this.
                .bindPopup('<b>'+trail.name+'</b><br /><a class="have">I have hiked this<span class="hidden">'+ 
                  trail.name+'</span></a><br /><a class="want-to">I want to hike this<span class="hidden">'+ 
                  trail.name+'</span></a><br /><a href="/#/info" class="get-info">Click for more info</a>').addTo($scope.map);
            }
            // Store all the markers in our own array here so we can do work on it later:
            $scope.markers.push(marker);
          });
        $scope.getting_markers = false;  
        });
      });
  };

  ///// This code gets user's location, renders a leaflet map showing that location when they land on this page:
  navigator.geolocation.getCurrentPosition(function(position) {
    console.log(position.coords.latitude, position.coords.longitude);
    var lat = position.coords.latitude;
    var long = position.coords.longitude;

    // Couldn't get the ng-if to work on spiffygif...
    $scope.loading = false;   
    // So use apply...makes it work!
    $scope.$apply();
    
    // Initialize the leaflet map:
    var map = L.map('map').setView([lat, long], 9);
    // Set it on the angular scope:
    $scope.map = map;
    // Add a tile layer to our map (from mapbox):
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZWR1bGlzOCIsImEiOiJjaWt1M2RzeW8wMDk4dnltM3h5ZXlwb24wIn0.DfujBg6HeQHg5ja-tZyYRw', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.satellite',
      accessToken: 'pk.eyJ1IjoiZWR1bGlzOCIsImEiOiJjaWt1M2RzeW8wMDk4dnltM3h5ZXlwb24wIn0.DfujBg6HeQHg5ja-tZyYRw'
    }).addTo(map);
    // User's location:
    L.marker([lat, long], {icon: mapMarker}).addTo(map).bindPopup("Here you are").openPopup();

  });
  ////////////// Click Listeners ////////////////////
  // Ugly jQuery hack to implement click listeners
  // Bug: one click is transformed into two clicks. Somehow these click listeners get registered twice. This has no effect on functionality.
  $('body').on('click', '.have', function(){
    // We access trailName through the hidden span:
    var trailName = $(this).children().html();
    // Change icon's color:
    $scope.changeColor(trailName, $scope.greenIcon, 'did it');
    // Store trail in hasDone array in DB with trailPost http request:
    $scope.trailPost(trailName, '/hasDone');
    // Make sure it is moved from wantToDo array
    $scope.moveTrail(trailName, '/moveTrails');
    // Re-render new information, wait a bit to make sure DB is done saving:
    // moveTrail will call getUser, so following line is probably unnecessary and left commented out:
    //$scope.getUser();
    
    
  });

  $('body').on('click', '.want-to', function(){
    var trailName = $(this).children().html();
    $scope.changeColor(trailName, yellowIcon);
    $scope.trailPost(trailName, '/wantToDo');
    // Re-render new info, waiting a bit so DB has time to finish saving:
    setTimeout(function(){
      $scope.getUser();
    }, 400);
  });

  ///////////// Helpers //////////////
  $scope.changeColor = function (trailName, icon, intent) {
      $scope.markers.forEach(function(element, i, arr){
      if(element.options.title === trailName){
        // _.latlng is a leaflet attribute
        var latlng = element._latlng;
        // remove the marker:
        $scope.map.removeLayer(element);
        // re-create it as an icon:
        element = L.marker([latlng.lat, latlng.lng], {icon: icon} ).addTo($scope.map);
        // L.marker will not take more than two parameters ... !?
        // So title is set here:
        element.options.title = trailName;
        // If they clicked "I have hiked this"...
        // Remove the 'have hiked' option
        if(intent === 'did it') {
          element.bindPopup('Been here, done that<br /><b>'+trailName+'</b><br /><a class="want-to">I want to hike this again<span class="hidden">'+trailName+'</span></a>').openPopup();
        } 
        // If they clicked "I want to hike this"...
        // Remove the 'want to' option:
        else {
          element.bindPopup('<b>'+trailName+'</b><br /><a class="have">I have hiked this<span class="hidden">'+trailName+'</span>').openPopup();
        }
      }
    });
  };
});





