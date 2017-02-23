# huffman.js

[![npm version](https://badge.fury.io/js/huffman.js.png)](https://badge.fury.io/js/huffman.js)
[![build status](https://travis-ci.org/jasonHzq/huffman.js.svg)](https://travis-ci.org/jasonHzq/huffman.js)
[![npm downloads](https://img.shields.io/npm/dt/huffman.js.svg?style=flat-square)](https://www.npmjs.com/package/huffman.js)

## install

```sh
$ npm i -S huffman.js
```

## Usage

### 

```js
import compress, { deCompress } from 'huffman.js';

// result are printable string
const result = compress(cipher);

const cipher = deCompress(result);
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2015-2016 Recharts Group
