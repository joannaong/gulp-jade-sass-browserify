exports.debounce = function(func, wait, immediate) {
  var timeout;
  timeout = null;
  return function() {
    var args, context;
    context = this;
    args = arguments;
    if (immediate && timeout === null) {
      func.apply(context, args);
    }
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    }, wait);
  }
}

exports.clamp = function(v, min, max) {
  v = (v<min)?min:v;
  v = (v>max)?max:v;
  return v;
}