'use strict';

/**
 * merge helper function to merge objects
 * @param  {Object} defaults
 * @param  {Object} options
 * @return {Object}
 */
module.exports.merge = function (defaults, options) {
  defaults = defaults || {};
  if (options && typeof options === 'object') {
      const keys = Object.keys(options);

      for (let i = 0; i < keys.length; i += 1) {
      if (options[keys[i]] !== undefined) {
       defaults[keys[i]] = options[keys[i]];
      }
    }
  }
  return defaults;
};
