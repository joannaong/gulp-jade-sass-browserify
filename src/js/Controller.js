// internal requires
window.util = util = require('./Util.js');
var dataLoader = require('./DataLoader.js');


var init = function() {
  console.log("init");
}

var buildObjects = function() {
  console.log("buildObjects this");
}

var buildHandlers = function() {
  console.log("buildHandlers that");
}

// on document ready
$(function() {
  init();
});