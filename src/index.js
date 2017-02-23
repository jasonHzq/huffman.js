// 找到 value 最小的节点
function findMin(nodes) {
  if (!nodes.length) {
    throw new Error('node too little');
  } else if (nodes.length === 1) {
    return nodes[0];
  }

  let [minNode, ...restNodes] = nodes;
  
  restNodes.forEach(node => {
    if (node.value < minNode.value) {
      minNode = node;
    }
  });

  return minNode;
}

// 构建哈夫曼节点表
function getNodeMap(codes) {
  const nodeMap = {};
  
  codes.forEach(code => {
    if (nodeMap[code]) {
      nodeMap[code].value++;
    } else {
      nodeMap[code] = {
        value: 1,
        code,
      };
    }
  });

  return nodeMap;
}

// 根据节点列表构建哈夫曼树
function getHuffmanTree(nodes) {
  if (nodes.length === 1) {
    return nodes[0];
  }
  
  const minNode = findMin(nodes);
  let restNodes = nodes.filter(node => node !== minNode);

  const secMinNode = findMin(restNodes);
  restNodes = restNodes.filter(node => node !== secMinNode);

  const rootTreeNode = {};
  
  rootTreeNode.leftChild = minNode;
  rootTreeNode.rightChild = secMinNode;
  rootTreeNode.value = minNode.value + secMinNode.value;

  return getHuffmanTree([...restNodes, rootTreeNode]);
}

// 根据哈夫曼树构造加密表
function getTreeMap(treeNode, path = '0') {
  if (treeNode.code) {
    return {
      [treeNode.code]: path,
    }
  }

  let leftMap = {};
  let rightMap = {};

  if (treeNode.leftChild) {
    leftMap = getTreeMap(treeNode.leftChild, path + '0');
  }

  if (treeNode.rightChild) {
    rightMap = getTreeMap(treeNode.rightChild, path + '1');
  }

  return {
    ...leftMap,
    ...rightMap,
  }
}

// 根据长度 len 切割字符串
function splitByLength(str, len) {
  if (str.length > len) {
    return [str.slice(0, len), ...splitByLength(str.slice(len), len)];
  } else if (!str) {
    return [];
  }

  return [str];
}

function last(arr) {
  return arr[arr.length - 1]
}

function repeat(repeatNum, defaultValue = '') {
  if (repeatNum === 0 ) {
    return [];
  }

  if (repeatNum > 0) {
    return [defaultValue, ...repeat(repeatNum - 1, defaultValue)];
  }

  if (repeatNum < 0) {
    throw new Error('params error in repeat, repeatNum should be positive');
  }
}

/*
 * encode 码是 encodeURI 不会进行编码的字符
 * 如字母(52)、数字(10)、标点符号（_, -），共计 64
 */

const encodeMap = [
  ...repeat(26).map((ch, index) => String.fromCharCode('a'.charCodeAt(0) + index)),
  ...repeat(26).map((ch, index) => String.fromCharCode('A'.charCodeAt(0) + index)),
  ...repeat(10).map((ch, index) => String.fromCharCode('0'.charCodeAt(0) + index)),
  '_',
  '-',
];

// 根据二进制码获取 encode 码
function getEncode(binCode) {
  const codeNum = parseInt(binCode, 2);

  return encodeMap[codeNum];
}

function getBincode(encode) {
  const index = encodeMap.findIndex(en => en === encode);
  
  return (index + 0x40).toString(2).slice(1);
}

// 根据加密表获取结果
function encode(codes, treeMap) {
  // allCode 是二进制码
  const allCode = codes
    .map(code => treeMap[code])
    .join('')
  // 二进制码压缩成 encode 码
  const splittedCodes = splitByLength(allCode, 6);
  let lastCode = last(splittedCodes);
  let restLength = 0;

  if (lastCode.length < 6) {
    restLength = 6 - lastCode.length;

    splittedCodes[splittedCodes.length - 1] = lastCode + repeat(restLength, '0').join('');
  }

  const codeRes = splittedCodes.map(code => {
    return getEncode(code);
  }).join('');

  return '' + restLength + codeRes;
}

function decodeHelper(allCode, valueMap, val = '') {
  if (!allCode) {
    return val;
  }

  const values = Object.keys(valueMap);

  for (let i = 0;i < values.length; ++i) {
    const currVal = values[i];
    const currLen = currVal.length;

    if (allCode.indexOf(currVal) === 0) {
      return decodeHelper(allCode.slice(currLen), valueMap, val + valueMap[currVal]);
    }
  }
}

function decode(_cipher, treeMap) {
  const restLength = _cipher[0];

  const cipher = _cipher.slice(1);

  const splittedCodes = cipher.split('').map(ch => {
    return getBincode(ch);
  });
  const allCode = do {
    const codes = splittedCodes.join('');
    const codeLength = codes.length;
    const finalCodeLength = codeLength - restLength;

    codes.slice(0, finalCodeLength);
  };
  const valueMap = Object.keys(treeMap)
    .reduce((res, key) => {
      const code = treeMap[key];

      return {
        ...res,
        [code]: key,
      };
    }, {});

  return decodeHelper(allCode, valueMap);
}

// 压缩解密钥匙 
function compressKey(nodeMap) {
  return Object.keys(nodeMap).map(key => {
    const val = nodeMap[key].value;
    
    return `${key}~${val}`;
  }).join('!');
}

// 压缩
export default function compress(originStr, len = 1) {
  const str = splitByLength(originStr, len).map(el => {
    return el.split('').reduce((res, ch) => {
      return res * 128 + ch.charCodeAt(0);
    }, 0);
  }).map(num => String.fromCharCode(num)).join('');

  const codes = str.split('');
  const nodeMap = getNodeMap(codes);
  const nodes = Object.keys(nodeMap).map(key => nodeMap[key]);
  const tree = getHuffmanTree(nodes);
  const treeMap = getTreeMap(tree);

  const cipher = encode(codes, treeMap);
  const keys = compressKey(nodeMap);

  return {
    cipher,
    keys,
  };
}

// 解压缩
export function deCompress({ cipher, keys }, len = 1) {
  const nodeMap = keys.split('!').reduce((res, key) => {
    const [code, value] = key.split('~');

    return {
      ...res,
      [code]: {
        code,
        value: parseInt(value, 10),
      },
    };
  }, {});
  const nodes = Object.keys(nodeMap).map(key => nodeMap[key]);
  const tree = getHuffmanTree(nodes);
  const treeMap = getTreeMap(tree);

  const result = decode(cipher, treeMap);
  return result.split('').map(ch => {
    const code = ch.charCodeAt(0);
    const finalCode = do {
      let codeStr = code.toString(2);
      
      if (codeStr.length % 7 !== 0) {
        codeStr = repeat(7 - codeStr.length % 7, '0').join('') + codeStr;
      }
      
      codeStr;
    }

    const codes = splitByLength(finalCode, 7).map(c => {
      return parseInt(c, 2);
    });

    return codes.map(c => {
      return String.fromCharCode(c);
    }).join('');
  }).join('');
}