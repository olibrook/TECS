#!/usr/bin/env node

var fs = require('fs'),
    lazy = require('lazy');


/*
 * Parser class for the Hack assembly language.
 */
function Parser(){
    
}

/*
 * Returns true if there are more commands remaining in the
 * input stream.
 */
Parser.prototype.hasMoreCommands = function(){
    
}

/*
 * Reads the next command from the input and makes it the current command.
 */
Parser.prototype.advance = function(){
    
}

/*
 * Returns the command type of the current command (either A_COMMAND, C_COMMAND
 * or L_COMMAND);
 */
Parser.prototype.commandType = function(){
    
}

/*
 * Returns the symbol or decimal xxx of the current command when the command
 * is an A_COMMAND or an L_COMMAND.
 */
Parser.prototype.symbol = function(){
    
}

/*
 * Returns the dest mnemonic in the current command if it is a C_COMMAND.
 */
Parser.prototype.dest = function(){
    
}

/*
 * Returns the comp mnemonic in the current command if it is a C_COMMAND.
 */
Parser.prototype.comp = function(){
    
}
 
 /*
  * Returns the jump mnemonic in the current command if it is a C_COMMAND.
  */
Parser.prototype.jump = function(){
    
}


/*
 * Code generator class for the Hack assembly language. Returns machine-language
 * instrunctions for mnemonic codes used in the assembly language.
 */
function Code(){
    
    this.destMap = {
        'null': '000',
        'M'   : '001',
        'D'   : '010',
        'MD'  : '011',
        'A'   : '100',
        'AM'  : '101',
        'AD'  : '110',
        'AMD' : '111'
    }
    
    this.compMap = {
        '0'      : '0101010',
        '1'      : '0111111',
        '-1'     : '0111010',
        'D'      : '0001100',
        'A'      : '0110000',
        '!D'     : '0001101',
        '!A'     : '0110001',
        '-D'     : '0001111',
        '-A'     : '0110011',
        'D+1'    : '0011111',
        'A+1'    : '0110111',
        'D-1'    : '0001110',
        'A-1'    : '0110010',
        'D+A'    : '0000010',
        'D-A'    : '0010011',
        'A-D'    : '0000111',
        'D&A'    : '0000000',
        'D|A'    : '0010101',
        'M'      : '1110000',
        '!M'     : '1110001',
        '-M'     : '1110011',
        'M+1'    : '1110111',
        'M-1'    : '1110010',
        'D+M'    : '1000010',
        'D-M'    : '1010011',
        'M-D'    : '1000111',
        'D&M'    : '1000000',
        'D|M'    : '1010101'
    }
    
    this.jumpMap = {
        'null'  : '000',
        'JGT'   : '001',
        'JEQ'   : '010',
        'JGE'   : '011',
        'JLT'   : '100',
        'JNE'   : '101',
        'JLE'   : '110',
        'JMP'   : '111'
    }
}

Code.prototype.defined = function(mnemonic, result){
    if(typeof(result) === 'undefined'){
        throw Error('Unknown mnemonic encountered "' + mnemonic + '"');
    }
    return result;
}

/*
 * Returns the 3-bit dest field in binary for the given mnemonic.
 */
Code.prototype.dest = function(mnemonic){
    return this.defined(mnemonic, this.destMap[mnemonic]);
}

/*
 * Returns the 7-bit comp field in binary for the given mnemonic.
 */
Code.prototype.comp = function(mnemonic){
    return this.defined(mnemonic, this.compMap[mnemonic]);
}
 
/*
 * Returns the 3-bit jump field in binary for the given mnemonic.
 */
Code.prototype.jump = function(mnemonic){
    return this.defined(mnemonic, this.jumpMap[mnemonic]);
}




if(process.argv.length !== 4) {
    console.log('Usage: assembler.js inFile outFile');
    process.exit(1);
}

var code = new Code();

console.log('0000' + code.jump('JEQ') + code.dest('AMD') + code.jump('JEQ'));