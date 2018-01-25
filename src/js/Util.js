export default class Util {
  constructor() {

  }

  static debounce(func, wait, immediate) {
    var timeout = null;
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

  static clamp(v, min, max) {
    v = (v<min)?min:v;
    v = (v>max)?max:v;
    return v;
  }
}


