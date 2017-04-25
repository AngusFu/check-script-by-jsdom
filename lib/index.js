var Promise = require("bluebird");
var jsdom = require('jsdom');
var USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:53.0) Gecko/20100101 Firefox/53.0'
];

module.exports = function (url, pattern, timeout) {
  var installedMsg = {
    errno: 0,
    errmsg: 'installed'
  };

  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject('timeout');
    }, timeout || 4 * 1000);
    var installed = false;

    jsdom.env({
      url: url,
      userAgent: USER_AGENTS[Math.random() * USER_AGENTS.length | 0],
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
      },

      resourceLoader: function (res, callback) {
        if (installed) {
          return callback(null, '');
        }

        // script src matched
        if (pattern.test(res.url.href)) {
          installed = true;
          clearTimeout(timer);
          resolve(installedMsg);
          callback(null, '');
        } else {
          // fetch and run scripts
          // our target may be in a subrequest
          return res.defaultFetch(function (err, body) {
            if (err) {
              callback(err);
            }
          });
        }
      },

      done: function (error, window) {
        clearTimeout(timer);

        // error on request
        if (error) {
          reject({
            errno: 2,
            errmsg: 'network error'
          });
          return;
        }

        // last struggle
        var scripts = [].slice.call(window.document.querySelector('script'));
        var installed = scripts.some(function (s) {
          return pattern.test(s.src);
        });

        if (installed) {
          resolve(installedMsg);
          return;
        }

        reject({
          errno: 1,
          errmsg: 'not installed'
        });
      }
    });

  });
};