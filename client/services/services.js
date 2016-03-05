angular.module('hikexpert.services', [])

.factory('Home', function($http){

  var getCoords = function(userInfo){
    return $http({
      method: 'POST',
      url: 'api/coords',
      data: userInfo
    }).then(function(resp){
      return resp.data;
    });
  };

  var getUser = function(){
    return $http({
      method: 'GET',
      url: '/getUser'
    })
    .then(function (resp) {
      return resp.data;
    });
  };
  // Puts trails in hasDone or wantToDo arrays, based on the url endpoint used
  var trailPost = function (trailName, url) {
    var trailObj = {
      trailName : trailName
    };
    return $http({
      method: 'POST',
      url : url,
      data : trailObj
    });
  };

  return {
    trailPost : trailPost,
    getUser : getUser,
    getCoords : getCoords
  };
})

.factory('Auth', function($http, $location, $window) {
  var signin = function(user) {
    return $http({
      method: 'POST',
      url: '/signin',
      data: user
    })
    .then(function(resp) {
      return resp.data.token;
    });
  };
  
  var signup = function(user) {
    return $http({
      method: 'POST',
      url: '/signup',
      data: user
    })
    .then(function(resp) {
      return resp.data.token;
    });
  };
  
  var isAuth = function() {
    return !!$window.localStorage.getItem('com.hikexpert');
  };
  
  var signout = function() {
    $window.localStorage.removeItem('com.hikexpert');
    $location.path('/signin');
  };
  
  return {
    signin : signin,
    signup : signup,
    isAuth : isAuth,
    signout : signout
  };
})

//TODO: service for shared trial information
.factory('Info', function($http) {
  var getInfo = function(info) {
    // console.log("inside factory " + info);
    // var lat = info[0];
    // var lng = info[1];
    // var infoForServer = {
    //   lat: lat,
    //   lng: lng
    // };
    // console.log(infoForServer);
    return $http({
      method: 'POST',
      url: 'api/trailinfo',
      data: info
    })
    .then(function(res) {
      console.log("still in factory");
      return res.data;
    });
  };
  return {
    getInfo: getInfo 
  };
})

.factory('InfoStorage', function(){
    // var infoForServer = function(info){
    //     var lat = info[0];
    //     var lng = info[1];
    //     var packagedInfo = {
    //       lat: lat,
    //       lng: lng
    //     }  
    //     return packagedInfo;
    // };

    // var holdInfo = function(packagedInfo){
    //     return packagedInfo;
    // };
    //var information = infoForServer(info);

    var packagedInfo = {};
    return {
      setData: function(info) {
        var lat = info[0];
        var lng = info[1];
        packagedInfo[lat] = lat;
        packagedInfo[lng] = lng;
      },
      getData: function() {
        return packagedInfo;
      }
  
    }
});


// .factory('InfoStorage', function(){
//     var infoForServer = function(info){
//       var lat = info[0];
//       var lng = info[1];
//       var info = {
//         lat: lat,
//         lng: lng
//       }
//       return info;
//     };
    
//     return {
//       infoForServer: infoForServer,
//       getinfo: function(){
//         return ;
//       }
//     }
// });
// .factory('Info', function($http) {
//   var getInfo = function() {
//    return $http({
//       method: 'GET',
//       url: 'api/trailinfo'
//     })
//     .then(function(res) {
//       return res.data;
//     });
//   };
//   return {
//     getInfo: getInfo
//   }
// });