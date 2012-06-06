#!/usr/bin/env node

if(process.argv.length !== 4) {
    console.log('Usage: assembler.js inFile outFile');
    process.exit(1);
}

var inFile = process.argv[2],
    outFile = process.argv[3];

console.log(inFile);
console.log(outFile);