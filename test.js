var check = require('./lib/index');
var pattern = /https?:\/\/s\.union\.360\.cn\/\d+\.js/;

check(
  'https://yyzl.github.io/',
  pattern,
  3 * 1000
).then(function (e) {
  console.log(e);
}).catch(function (e) {
  console.log(e);
});
