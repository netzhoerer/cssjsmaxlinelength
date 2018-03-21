#!/usr/bin/env node --harmony
'use strict';

const program = require('commander');
const fs = require('fs');
const pkg = require('./package.json');
const glob = require('glob');
const os = require('os');

const setMaxLineLength = (num) => {
  if(num) {
    return parseInt(num, 10);
  }
  return 500;
};

const list = (directory, options) => {
  const path = directory || process.cwd();

  let params = [];
  let recursive = false;
  let maxLineLength = setMaxLineLength(options.lineLength);

  if (options.recursive) {
    recursive = true;
  }

  if (options.css) {
    if (recursive) {
      params.push({ path: '**/*.css', newLineAfterChar: '}' });
    } else {
      params.push({ path: '*.css', newLineAfterChar: '}' });
    }
  }

  if (options.js) {
    if (recursive) {
      params.push({ path: '**/*.js', newLineAfterChar: ';' });
    } else {
      params.push({ path: '*.js', newLineAfterChar: ';' });
    }
  }


  params.forEach((param) => {
    glob(path + '/' + param.path, (er, files) => {
      files.forEach(file => parseFile(file, param.newLineAfterChar, maxLineLength))
    })
  });
};

const chunkSubstr = (str, size) => {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
};

const parseFile = (file, newLineAfterChar, maxLineLength) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      return console.log(err);
    }
    const splitedString = chunkSubstr(data, maxLineLength);

    let splitedStringWithNewLines = splitedString.map((split) => {
      const position = split.lastIndexOf(newLineAfterChar) + 1;
      if(position < 10) {
        return split;
      }
      return [split.slice(0, position), os.EOL, split.slice(position)].join('');
    });

    const result = splitedStringWithNewLines.join('');

    fs.createReadStream(file).pipe(fs.createWriteStream(file + '.bak'));


    fs.writeFile(file, result, 'utf8', function (err) {
      if (err) {
        return console.log(err);
      }
    });
  });
};

program
.version(pkg.version)
.command('list [directory]')
.option('-j, --js', 'manipulate JS')
.option('-c, --css', 'manipulate CSS')
.option('-r, --recursive', 'include subdirectories')
.option('-l, --lineLength <lineLength>', 'line length', setMaxLineLength)
.action(list);

program.parse(process.argv);
