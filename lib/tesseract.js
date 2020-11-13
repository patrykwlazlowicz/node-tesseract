'use strict';

/**
 * Module dependencies.
 */
const utils = require('./utils');
const exec = require('child_process').exec;
const fs = require('fs');
const tmpdir = require('os').tmpdir(); // let the os take care of removing zombie tmp files
const uuid = require('uuid');
const path = require('path');
const glob = require('glob');

const Tesseract = {

  tmpFiles: [],

  /**
   * options default options passed to Tesseract binary
   * @type {Object}
   */
  options: {
    'l': 'eng',
    'psm': 3,
    'config': null,
    'binary': 'tesseract'
  },

  /**
   * outputEncoding
   * @type {String}
   */
  outputEncoding: 'UTF-8',

  /**
   * Runs Tesseract binary with options
   *
   * @param {String} image
   * @param {Object} options to pass to Tesseract binary
   */
  process: function (image, options) {
    return new Promise((resolve, reject) => {
      const defaultOptions = utils.merge({}, Tesseract.options);
      options = utils.merge(defaultOptions, options);

      // generate output file name
      const output = path.resolve(tmpdir, 'node-tesseract-' + uuid.v4());

      // add the tmp file to the list
      Tesseract.tmpFiles.push(output);

      // assemble tesseract command
      let command = [options.binary, image, output];

      if (options.l !== null) {
        command.push('-l ' + options.l);
      }

      if (options.psm !== null) {
        command.push('--psm ' + options.psm);
      }

      if (options.config !== null) {
        command.push(options.config);
      }

      command = command.join(' ');

      const opts = options.env || {};

      // Run the tesseract command
      exec(command, opts, function (err) {
        if (err) {
          return reject(err);
        }

        // Find one of the three possible extension
        glob(output + '.+(html|hocr|txt)', function (err, files) {
          if (err) {
            return reject(err);
          }
          fs.readFile(files[0], Tesseract.outputEncoding, function (err, data) {
            if (err) {
              return reject(err);
            }

            const index = Tesseract.tmpFiles.indexOf(output);
            if (~index) Tesseract.tmpFiles.splice(index, 1);

            fs.unlink(files[0], (err) => {
              if (err) {
                return reject(err);
              }
            });
            return resolve(data);
          });
        })
      }); // end exec
    });
  }

};

function gc() {
    for (let i = Tesseract.tmpFiles.length - 1; i >= 0; i--) {
        try {
            fs.unlinkSync(Tesseract.tmpFiles[i] + '.txt');
        } catch (err) {
        }

      const index = Tesseract.tmpFiles.indexOf(Tesseract.tmpFiles[i]);
      if (~index) Tesseract.tmpFiles.splice(index, 1);
    }
}

const version = process.versions.node.split('.').map(function (value) {
  return parseInt(value, 10);
});

if (version[0] === 0 && (version[1] < 9 || version[1] === 9 && version[2] < 5)) {
    process.addListener('uncaughtException', function _uncaughtExceptionThrown(err) {
        gc();
        throw err;
    });
}

// clean up the tmp files
process.addListener('exit', function _exit(code) {
    gc();
});

/**
 * Module exports.
 */
module.exports.process = Tesseract.process;
