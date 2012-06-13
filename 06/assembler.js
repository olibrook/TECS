#!/usr/bin/env node

var fs = require('fs');


function LineReader(path){
    
    // Contents of the file gets read into a string as we scan for newlines.
    this.buffer = "";
    
    // Scan position into this.buffer for newline characters.
    this.newlinePosition = 0;
    
    // Amount read from the file at a time.
    this.chunkSize = 1024;
    this.path = path;
    this.fd = null;
}


LineReader.prototype = {
    
    open: function(){
        this.fd = fs.openSync(this.path, "r");
    },
    
    close: function(){
        fs.closeSync(this.fd);
    },
    
    _read: function(){
        // Read from current position in the file (position=null).
        // Hack assembly files are ASCII.
        var result = fs.readSync(this.fd, this.chunkSize, null, 'ASCII'),
            content = result[0],
            bytesRead = result[1];

        this.buffer += content;
        return bytesRead;
    },
    
    _readUntilLineOrEOF: function(){
        var lineEnd = -1, bytesRead;

        while(lineEnd === -1){
            lineEnd = this.buffer.indexOf('\n', this.newlinePosition);

            if(lineEnd === -1){
                this.newlinePosition = this.buffer.length -1;

                bytesRead = this._read();

                if(bytesRead===0) {
                    // End of file. Return true if the buffer is not empty,
                    // treat the last line in the file as a full line if not
                    // terminated by a newline.
                    return this.buffer.length > 0;
                }
            }
        }
        this.newlinePosition = lineEnd;
        return true;
    },
    
    hasLines: function(){
        return this._readUntilLineOrEOF();
    },
    
    next: function(){
        var ret = this.buffer.slice(0, this.newlinePosition);
        this.buffer = this.buffer.slice(this.newlinePosition + 1); // Skip the newline itself.
        this.newlinePosition = 0;
        return ret;
    }
}



function zeroPad(str, pad){
    while(str.length < pad){
        str = '0' + str;
    }
    return str;
}




/*
 * Parser class for the Hack assembly language.
 */
function Parser(lineReader){
    this.lineReader = lineReader;
    this.currentLine = '';
    this.currentCommand = '';
}


Parser.prototype = {
    
    /*
     * Returns true if there are more commands remaining in the
     * input stream.
     */
    hasMoreCommands: function(){
        while((this.currentLine === '') && (this.lineReader.hasLines())){

            this.currentLine = this.lineReader.next();
            this.currentLine = this.currentLine.replace(/\/\/.+/, ''); // Strip comments
            this.currentLine = this.currentLine.replace(/\s/g, ''); // Strip whitespace
        }
        return (this.currentLine !== '');
    },
    
    /*
     * Reads the next command from the input and makes it the current command.
     */
    advance: function(){
        this.currentCommand = this.currentLine;
        this.currentLine = '';
    },
    
    /*
     * Returns the command type of the current command (either A_COMMAND, C_COMMAND
     * or L_COMMAND);
     */
    commandType: function(){
        if(this.currentCommand.match(/^@/)){
            return 'A_COMMAND';
        } else if(this.currentCommand.match(/\(/)) {
            return 'L_COMMAND';
        } else {
            return 'C_COMMAND';
        }
    },
    
    /*
     * Returns the symbol or decimal xxx of the current command when the command
     * is an A_COMMAND or an L_COMMAND.
     */
    symbol: function(){
        if(this.commandType() == 'A_COMMAND'){
            return zeroPad(parseInt(this.currentCommand.substring(1)).toString(2), 15);
        }
        return null;
    },
    
    /*
     * Returns the dest mnemonic in the current command if it is a C_COMMAND.
     */
    dest: function(){
        var index = this.currentCommand.indexOf('=');
        if(index > 0){
            return this.currentCommand.substring(0, index);
        }
        return 'null';
    },
    
    /*
     * Returns the comp mnemonic in the current command if it is a C_COMMAND.
     */
    comp: function(){
        var start = this.currentCommand.indexOf('='),
            end = this.currentCommand.indexOf(';');

        start = start < 0 ? 0 : Math.min(start + 1, this.currentCommand.length);
        end = end < 0 ? this.currentCommand.length : end;

        return this.currentCommand.substring(start, end);
    },
    
    /*
     * Returns the jump mnemonic in the current command if it is a C_COMMAND.
     */
    jump: function(){
        var index = this.currentCommand.indexOf(';');
        if(index > 0){
            index = Math.min(index + 1, this.currentCommand.length);
            return this.currentCommand.substring(index);
        }
        return 'null';
    }
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

Code.prototype = {
    
    defined: function(mnemonic, result){
        if(typeof(result) === 'undefined'){
            throw Error('Unknown mnemonic encountered "' + mnemonic + '"');
        }
        return result;
    },
    
    /*
     * Returns the 3-bit dest field in binary for the given mnemonic.
     */
    dest: function(mnemonic){
        return this.defined(mnemonic, this.destMap[mnemonic]);
    },
    
    /*
     * Returns the 7-bit comp field in binary for the given mnemonic.
     */
    comp: function(mnemonic){
        return this.defined(mnemonic, this.compMap[mnemonic]);
    },
    
    /*
     * Returns the 3-bit jump field in binary for the given mnemonic.
     */
    jump: function(mnemonic){
        return this.defined(mnemonic, this.jumpMap[mnemonic]);
    }
}





if(process.argv.length !== 4) {
    console.log('Usage: assembler.js inFile outFile');
    process.exit(1);
}



var reader, parser, code, outFile, binaryInstruction, commandType

reader = new LineReader(process.argv[2]);
reader.open();
parser = new Parser(reader);
code = new Code();
outFile = fs.openSync(process.argv[3], "w");


while(parser.hasMoreCommands()){
    parser.advance();
    commandType = parser.commandType();
    
    if(commandType == 'A_COMMAND'){
        binaryInstruction = '0' + parser.symbol();
        
    } else if(commandType == 'C_COMMAND'){
        binaryInstruction = '111';
        binaryInstruction += code.comp(parser.comp());
        binaryInstruction += code.dest(parser.dest());
        binaryInstruction += code.jump(parser.jump());
        
    } else {
        throw new Error('Unknown command type');
    }
    
    fs.writeSync(outFile, binaryInstruction + '\n', null, 'ascii');
}


reader.close();
fs.closeSync(outFile);