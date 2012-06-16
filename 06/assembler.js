#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    optimist = require('optimist');


function zeroPad(str, pad){
    while(str.length < pad){
        str = '0' + str;
    }
    return str;
}


function LineReader(path){
    
    // Contents of the file gets read into a string as we scan for newlines.
    this.buffer = "";
    
    // Scan position into this.buffer for newline characters.
    this.newlinePosition = 0;
    
    // Amount read from the file at a time.
    this.chunkSize = 1024;
    this.path = path;
    this.fd = null;
    this.position = 0;
}


LineReader.prototype = {
    
    open: function(){
        this.fd = fs.openSync(this.path, "r");
    },
    
    close: function(){
        fs.closeSync(this.fd);
    },
    
    _read: function(){
        var result = fs.readSync(this.fd, this.chunkSize, this.position, 'ASCII'),
            content = result[0],
            bytesRead = result[1];
        
        this.position += bytesRead;
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


/*
 * Parser class for the Hack assembly language.
 */
function Parser(lineReader){
    this.lineReader = lineReader;
    this.currentLine = '';
    this.currentCommand = '';
}


Parser.prototype = {
    
    rewind: function(){
        this.lineReader.position = 0;
    },
    
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
        this.currentCommandType = this._commandType();
    },
    
    /*
     * Returns the command type of the current command (either A_COMMAND, C_COMMAND
     * or L_COMMAND);
     */
    commandType: function(){
        return this.currentCommandType;

    },
    
    _commandType: function(){
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
        var symbol;
        if(this.commandType() === 'A_COMMAND'){
            symbol = this.currentCommand.substring(1);
            
            if(symbol.match(/^[0-9]+$/)) {
                return ['literal', zeroPad(parseInt(symbol).toString(2), 15)];
            } else {
                return ['symbol', symbol];
            }
        } else if(this.commandType() === 'L_COMMAND'){
            return ['symbol', this.currentCommand.substring(1, this.currentCommand.length-1)]
        }
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


function createSymbolTable(){
    var symbolTable =  {}, symbol, i;

    for(i = 0; i<=15; i++){
        symbol = 'R' + i;
        symbolTable[symbol] = i;
    }

    symbolTable['SP']     = 0x0000;
    symbolTable['LCL']    = 0x0001;
    symbolTable['ARG']    = 0x0002;
    symbolTable['THIS']   = 0x0003;
    symbolTable['THAT']   = 0x0004;
    symbolTable['SCREEN'] = 0x4000;
    symbolTable['KBD']    = 0x6000;
    
    for(k in symbolTable){
        symbolTable[k] = zeroPad(symbolTable[k].toString(2), 15);
    }
    return symbolTable;
}


function Driver(inFile, outFile){
    this.reader = new LineReader(inFile);
    this.symbolTable = createSymbolTable();
    this.parser = new Parser(this.reader, this.symbolTable);
    this.code = new Code();
    this.outFile = fs.openSync(outFile, "w");
    this.instructionCount = 0;
    this.nextRAMVarAddress = 0x0010;
}

Driver.prototype = {
    run: function(){
        var binaryInstruction, commandType, symbol, symbolValue, symbolType, symbolDesc;
        
        this.reader.open();
        
        // First pass scans for symbols.
        while(this.parser.hasMoreCommands()){
            this.parser.advance();
            commandType = this.parser.commandType();
            
            if(commandType === 'A_COMMAND' || commandType === 'C_COMMAND') {
                this.instructionCount++;
                
            } else if(commandType === 'L_COMMAND'){
                
                symbolDesc = this.parser.symbol();
                symbolType = symbolDesc[0];
                symbol = symbolDesc[1];
                
                if(!symbolType == 'symbol'){
                    throw new Error('"' + symbol +'" is not a valid symbol label.');
                } else {
                    this.symbolTable[symbol] = zeroPad(this.instructionCount.toString(2), 15);
                }
                
            } else {
                throw new Error('Unknown command type: "' + commandType + '"');
            }
        }
        
        this.parser.rewind();
        this.instructionCount = 0;
        
        // Second pass produces the output.
        while(this.parser.hasMoreCommands()){
            this.parser.advance();
            commandType = this.parser.commandType();

            if(commandType == 'A_COMMAND'){
                
                symbolDesc = this.parser.symbol();
                symbolType = symbolDesc[0];
                symbol = symbolDesc[1];
                
                if(symbolType === 'literal'){
                    symbolValue = symbol;
                    
                } else {
                    symbolValue = this.symbolTable[symbol];
                    
                    if(symbolValue === undefined) {
                        // RAM Variable declaration
                        symbolValue = zeroPad(this.nextRAMVarAddress.toString(2), 15);
                        this.symbolTable[symbol] = symbolValue;
                        this.nextRAMVarAddress++;
                    }
                }
                binaryInstruction = '0' + symbolValue;
                fs.writeSync(this.outFile, binaryInstruction + '\n', null, 'ascii');

            } else if(commandType == 'C_COMMAND'){
                binaryInstruction = '111';
                binaryInstruction += this.code.comp(this.parser.comp());
                binaryInstruction += this.code.dest(this.parser.dest());
                binaryInstruction += this.code.jump(this.parser.jump());
                fs.writeSync(this.outFile, binaryInstruction + '\n', null, 'ascii');

            } else if(commandType === 'L_COMMAND') {
                // No-op
            } else {
                throw new Error('Unknown command type: "' + commandType + '"');
            }
        }
        
        this.reader.close();
        fs.closeSync(this.outFile);
    }
}


exports.LineReader = LineReader;
exports.Parser = Parser;
exports.Code = Code;
exports.Driver = Driver;



/*
 * Configure and run the assembler if run as a script.
 */
if(require.main === module){

    argv = optimist.usage('Assembler for hack platform assembly language.\n\nUsage: $0')
            .options('f', {
                    alias : 'file',
                    default : process.cwd(),
            })
            .argv;


    if (argv.h || argv.help) {
            optimist.showHelp();
            process.exit(0);

    } else {
        (function(){
            var stats, inputFiles;
            stats = fs.statSync(argv.f);

            if(stats.isDirectory()) {
                inputFiles = glob.sync('**/*.asm', {cwd: argv.f});

            } else {
                inputFiles = [argv.f];
            }

            for (var i=0; i<inputFiles.length; i++) {
                var inputFile = inputFiles[i],
                    outputFile = path.join(
                        path.dirname(inputFile), path.basename(inputFile, '.asm')) + '.hack';

                new Driver(inputFile, outputFile).run();
            }
            process.exit(0);
        })();
    }
}