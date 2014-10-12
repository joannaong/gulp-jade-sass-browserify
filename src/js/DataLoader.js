var slidesData = {};

exports.load = function(__onComplete) {
  console.log("DataLoader.load");

  var promise = $.getJSON("asset/static.json");
  promise.then(function (data) {
    exports.slidesData = slidesData = data;
    __onComplete();
  });
}