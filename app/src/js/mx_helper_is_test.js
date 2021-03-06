/* jshint  esversion:6  */
export * from './is_test/index.js';

/**
* MapX specific test function
*/
export function isStory(item) {
  const h = mx.helpers;
  return h.isView(item) && h.path(item, 'data.story');
}

/**
 * Test if item is an language object, e.g. as defined in json schema
 * @param {Object} item to test
 */
export function isLanguageObject(item) {
  const h = mx.helpers;
  var languages = mx.settings.languages;
  return (
    h.isObject(item) &&
    (function() {
      return Object.keys(item).reduce((a, l) => (!a ? a : languages.indexOf(l) > -1 ), true);
    })()
  );
}

export function isLanguageObjectArray(arr) {
  const h = mx.helpers;
  return (
    h.isArray(arr) &&
    (function() {
      return arr.reduce((a, i) => (!a ? a : h.isLanguageObject(i)), true);
    })()
  );
}

/**
 * Check if a view is open
 * @return {Boolean}
 */
export function isViewOpen(view) {
  const h = mx.helpers;
  view = h.getView(view);
  return h.isView(view) && view._open === true;
}
