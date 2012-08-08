#!/usr/bin/env node

(function(){
    
    var fs = require('fs'),
        path = require('path'),
        glob = require('glob'),
        optimist = require('optimist'),
        linereader = require('./linereader');

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

    Parser.prototype.rewind = function(){
        this.lineReader.position = 0;
    };

    /*
     * Returns true if there are more commands remaining in the
     * input stream.
     */
    Parser.prototype.hasMoreCommands = function(){
        while((this.currentLine === '') && (this.lineReader.hasLines())){

            this.currentLine = this.lineReader.next();
            this.currentLine = this.currentLine.replace(/\/\/[\W\w]*/, ''); // Strip comments
            this.currentLine = this.currentLine.replace(/\s/g, ''); // Strip whitespace
        }
        return (this.currentLine !== '');
    };

    /*
     * Reads the next command from the input and makes it the current command.
     */
    Parser.prototype.advance = function(){
        this.currentCommand = this.currentLine;
        this.currentLine = '';
        this.currentCommandType = this.doGetCommandType();
    };

    /*
     * Returns the command type of the current command (either A_COMMAND, C_COMMAND
     * or L_COMMAND);
     */
    Parser.prototype.commandType = function(){
        return this.currentCommandType;

    };

    Parser.prototype.doGetCommandType = function(){
        if(this.currentCommand.match(/^@/)){
            return 'A_COMMAND';
        }
        
        if(this.currentCommand.match(/\(/)) {
            return 'L_COMMAND';
        }
        
        return 'C_COMMAND';
    };

    /*
     * Returns the symbol or decimal xxx of the current command when the command
     * is an A_COMMAND or an L_COMMAND.
     */
    Parser.prototype.symbol = function(){
        var symbol;
        
        if(this.commandType() === 'A_COMMAND'){
            symbol = this.currentCommand.substring(1);

            if(symbol.match(/^[0-9]+$/)) {
                return ['decimal', zeroPad(parseInt(symbol, 10).toString(2), 15)];
            }
            
            return ['symbol', symbol];
        }
        
        if(this.commandType() === 'L_COMMAND'){
            return ['symbol', this.currentCommand.substring(1, this.currentCommand.length-1)];
        }
    };

    /*
     * Returns the dest mnemonic in the current command if it is a C_COMMAND.
     */
    Parser.prototype.dest = function(){
        var index = this.currentCommand.indexOf('=');
        if(index > 0){
            return this.currentCommand.substring(0, index);
        }
        return 'null';
    };

    /*
     * Returns the comp mnemonic in the current command if it is a C_COMMAND.
     */
    Parser.prototype.comp = function(){
        var start = this.currentCommand.indexOf('='),
            end = this.currentCommand.indexOf(';');

        start = start < 0 ? 0 : Math.min(start + 1, this.currentCommand.length);
        end = end < 0 ? this.currentCommand.length : end;

        return this.currentCommand.substring(start, end);
    };

    /*
     * Returns the jump mnemonic in the current command if it is a C_COMMAND.
     */
    Parser.prototype.jump = function(){
        var index = this.currentCommand.indexOf(';');
        if(index > 0){
            index = Math.min(index + 1, this.currentCommand.length);
            return this.currentCommand.substring(index);
        }
        return 'null';
    };


    /*
     * Code generator class for the Hack assembly language. Returns machine-language
     * instructions for mnemonic codes used in the assembly language.
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
        };

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
        };

        this.jumpMap = {
            'null'  : '000',
            'JGT'   : '001',
            'JEQ'   : '010',
            'JGE'   : '011',
            'JLT'   : '100',
            'JNE'   : '101',
            'JLE'   : '110',
            'JMP'   : '111'
        };
    }

    Code.prototype.defined = function(mnemonic, result){
        if(typeof(result) === 'undefined'){
            throw new Error('Unknown mnemonic encountered "' + mnemonic + '"');
        }
        return result;
    };

    /*
     * Returns the 3-bit dest field in binary for the given mnemonic.
     */
    Code.prototype.dest = function(mnemonic){
        return this.defined(mnemonic, this.destMap[mnemonic]);
    };

    /*
     * Returns the 7-bit comp field in binary for the given mnemonic.
     */
    Code.prototype.comp = function(mnemonic){
        return this.defined(mnemonic, this.compMap[mnemonic]);
    };

    /*
     * Returns the 3-bit jump field in binary for the given mnemonic.
     */
    Code.prototype.jump = function(mnemonic){
        return this.defined(mnemonic, this.jumpMap[mnemonic]);
    };

    /*
     * 2-phase assembler for the Hack platform machine language, with
     * support for symbols.
     */
    function Assembler(inFile, outFile){
        
        this.SCAN_PHASE = 'SCAN_PHASE';
        this.CODE_PHASE = 'CODE_PHASE';
        this.PHASES = [this.SCAN_PHASE, this.CODE_PHASE];
        
        this.reader = new linereader.LineReader(inFile);
        this.symbolTable = new SymbolTable();
        this.parser = new Parser(this.reader, this.symbolTable);
        this.code = new Code();
        this.outFile = fs.openSync(outFile, "w");
        this.instructionCount = 0;
        this.nextRAMVarAddress = 0x0010;
        this.CALL_MAP = {
            'SCAN_PHASE': {
                'A_COMMAND': this.countInstruction,
                'C_COMMAND': this.countInstruction,
                'L_COMMAND': this.declareLabel
            },
            'CODE_PHASE': {
                'A_COMMAND': this.aCommand,
                'C_COMMAND': this.cCommand
            }
        };
    }

    Assembler.prototype.main = function(){
        var output, phase, i, commandType, callback;

        this.reader.open();

        for(i=0; i<this.PHASES.length; i+=1){
            phase = this.PHASES[i];

            while(this.parser.hasMoreCommands()){
                this.parser.advance();
                commandType = this.parser.commandType();
                callback = this.CALL_MAP[phase][commandType];

                if(callback !== undefined){
                    output = callback.call(this);

                    if(output !== undefined){
                        fs.writeSync(this.outFile, output + '\n', null, 'ascii');
                    }
                }
            }
            this.parser.rewind();
            this.instructionCount = 0;
        }

        this.reader.close();
        fs.closeSync(this.outFile);
    };

    /*
     * Callbacks handle instruction types at different phases of
     * assembly and are invoked with 'this' bound to an instance of Assembler.
     */
    Assembler.prototype.countInstruction = function(){
        this.instructionCount+=1;
    };

    Assembler.prototype.declareLabel = function(){
        var symbolDesc, symbolType, symbol;

        symbolDesc = this.parser.symbol();
        symbolType = symbolDesc[0];
        symbol = symbolDesc[1];
        this.symbolTable.set(symbol, zeroPad(this.instructionCount.toString(2), 15));
    };

    Assembler.prototype.aCommand = function(){
        var symbolDesc, symbolType, symbol, symbolValue, out;

        symbolDesc = this.parser.symbol();
        symbolType = symbolDesc[0];
        symbol = symbolDesc[1];

        if(symbolType === 'decimal'){
            symbolValue = symbol;

        } else {
            symbolValue = this.symbolTable.get(symbol);

            if(symbolValue === undefined) {
                // RAM Variable declaration
                symbolValue = zeroPad(this.nextRAMVarAddress.toString(2), 15);
                this.symbolTable.set(symbol, symbolValue);
                this.nextRAMVarAddress+=1;
            }
        }
        out = '0' + symbolValue;
        return out;
    };

    Assembler.prototype.cCommand = function(){
        var out;
        out = '111';
        out += this.code.comp(this.parser.comp());
        out += this.code.dest(this.parser.dest());
        out += this.code.jump(this.parser.jump());
        return out;
    };
    
    
    SymbolTable = function(){
        var symbol, i, k;
        
        this.obj = {};

        for(i = 0; i<=15; i+=1){
            symbol = 'R' + i;
            this.obj[symbol] = i;
        }

        this.obj.SP     = 0x0000;
        this.obj.LCL    = 0x0001;
        this.obj.ARG    = 0x0002;
        this.obj.THIS   = 0x0003;
        this.obj.THAT   = 0x0004;
        this.obj.SCREEN = 0x4000;
        this.obj.KBD    = 0x6000;

        for(k in this.obj){
            if (this.obj.hasOwnProperty(k)) {
                this.obj[k] = zeroPad(this.obj[k].toString(2), 15);
            }
        }
    };
    
    SymbolTable.prototype.get = function(symbol){
        return this.obj[symbol];
    };
    
    SymbolTable.prototype.set = function(symbol, value){
        if (this.obj[symbol] === undefined){
            this.obj[symbol] = value;
        } else {
            throw new Error('Symbol "' + symbol + '" is already defined.');
        }
    }
    
    exports.Parser = Parser;
    exports.Code = Code;
    exports.Assembler = Assembler;
    exports.SymbolTable = SymbolTable;
    
    (function(){
        
        var stats, inputFiles, i, argv, inputFile, outputFile;
        
        /*
         * Configure and run the assembler if run as a script.
         */
        if(require.main === module){
            argv = optimist.usage('Assembler for hack platform assembly language.\n')
                            .argv;

            if (argv.h || argv.help) {
                    optimist.showHelp();
                    process.exit(0);

            } else {

                if(argv._.length === 0) {
                    fileOrDir = process.cwd();

                } else if(argv._.length === 1) {
                    fileOrDir = argv._[0];

                } else {
                    optimist.showHelp();
                    process.exit(1);
                }
                stats = fs.statSync(fileOrDir);

                if(stats.isDirectory()) {
                    inputFileNames = glob.sync(fileOrDir + '**/*.asm');

                } else {
                    inputFileNames = [fileOrDir];
                }
                
                for (i=0; i<inputFileNames.length; i+=1) {
                    inputFile = inputFileNames[i];
                    outputFile = path.join(path.dirname(inputFile),
                                        path.basename(inputFile, '.asm')) + '.hack';

                    new Assembler(inputFile, outputFile).main();
                }

                process.exit(0);
            }
        }
    }());
    
}());