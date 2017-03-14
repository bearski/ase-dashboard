'use strict';
var fs = require('fs');
fs.createReadStream('.env-variables')
  .pipe(fs.createWriteStream('.env'));
