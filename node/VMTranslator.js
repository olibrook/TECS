#!/usr/bin/env node

(function(){

    var lr = require('./linereader'),
        optimist = require('optimist'),
        fs = require('fs'),
        glob = require('glob'),
        path = require('path'),

        C_ARITHMETIC = 'C_ARITHMETIC',
        C_PUSH = 'C_PUSH',
        C_POP = 'C_POP',
        C_LABEL = 'C_LABEL',
        C_GOTO = 'C_GOTO',
        C_IF = 'C_IF',
        C_FUNCTION = 'C_FUNCTION',
        C_RETURN = 'C_RETURN',
        C_CALL = 'C_CALL';


    function Parser(lineReader){
        this.lineReader = lineReader;
        this.currentLine = '';
        this.currentCommand = null;
        this.currentCommandType = null;
        this.commandParts = null;
    }

    /*
     * Returns true if there are more commands in the input.
     */
    Parser.prototype.hasMoreCommands = function(){
        while(!(this.currentLine.match(/\S/)) && (this.lineReader.hasLines())){

            this.currentLine = this.lineReader.next();
        
            // Strip comments
            this.currentLine = this.currentLine.replace(/\/\/[\W\w]*/, '');
        }
        // Return true if line not empty.
        return (this.currentLine.match(/\S/));
    };

    /*
     * Reads the next command and makes it the current command.
     */
    Parser.prototype.advance = function(){
        this.currentCommand = this.currentLine;
        this.currentLine = '';
        this.commandParts = this.currentCommand.match(/^\s*(\S+)?\s*(\S+)?\s*(\S+)?/).slice(1);
        this.currentCommandType = this.doGetCommandType();
    };

    /*
     * Returns the type of the current command as a string.
     */
    Parser.prototype.commandType = function(){
        return this.currentCommandType;
    };

    Parser.prototype.doGetCommandType = function(){
        var command, formats, requiredLength, i, re, commandType, partsLength;
    
        command = this.commandParts[0];
    
        formats = [
            [1, /^(add|sub|neg|eq|gt|lt|and|or|not)$/, C_ARITHMETIC],
            [3, /^push$/, C_PUSH],
            [3, /^pop$/, C_POP],
            [2, /^label$/, C_LABEL],
            [2, /^goto$/, C_GOTO],
            [2, /^if-goto$/, C_IF],
            [3, /^function$/, C_FUNCTION],
            [1, /^return$/, C_RETURN],
            [3, /^call$/, C_CALL]
        ];
    
        partsLength = this.commandParts.filter(function(item){
                return item !== undefined;
            }).length;
    
        for(i=0; i<formats.length; i+=1){
            requiredLength = formats[i][0];
            re = formats[i][1];
            commandType = formats[i][2];
        
            if(command.match(re) && partsLength === requiredLength){
                return commandType;
            }
        }
    
        throw new Error("Parser error");
    };

    /*
     * Returns the first argument of the current command as a string.
     */
    Parser.prototype.arg1 = function(){
        return this.commandParts[1];
    };

    /*
     * Returns the second argument of the current command as an integer.
     */
    Parser.prototype.arg2 = function(){
        if(!this.commandParts[2].match(/^[0-9]+$/)){
            throw new Error("Cannot parse '" + this.commandParts[2] + "' as an integer.");
        } else {
            return parseInt(this.commandParts[2], 10);
        }
    };

    function Code(){
    
        // Used to generate unique labels for branching commands.
        this.eqCount = 0;
        this.ltCount = 0;
        this.gtCount = 0;
    
        // Used to generate labels for the static segment.
        this.fileName = null;
    
        // Used to generate unique labels for return addresses.
        this.functionCallCount = 0;
        
        this.commands = null;
        
        this.addressMap = {
            'local': 'LCL',
            'argument': 'ARG',
            'this': 'THIS',
            'that': 'THAT'
        };
    
        this.baseAddresses = {
            'temp': 5,
            'pointer': 3
        };
    }
    
    Code.prototype.newCommand = function(){
        this.commands = [];
        return this;
    };
    
    /**
     * Common setup for binary commands.
     */
    Code.prototype.binary = function(){
        this.asm(
            '@SP',      // Load the address of the SP
            'AM=M-1',   // Decrement the SP
            'D=M',      // Load the second parameter into D 
            '@SP',
            'AM=M-1'    // Decrement SP and leave A with the address of the first parameter
        );
        return this;
    };
    
    /**
     * Common setup for binary commands.
     */
    Code.prototype.shortBinary = function(){
        this.asm(
            '@SP',      // Load the address of the SP
            'AM=M-1',   // Decrement the SP
            'D=M',      // Load the second parameter into D 
            'A=A-1'     // Leave A with the address of the first parameter
        );
        return this;
    };
    
    /**
     * Common setup for unary commands.
     */
    Code.prototype.unary = function(){
        this.asm(
            '@SP',      // Load the address of the SP
            'A=M-1',    // Load the address of the value it points to
            'D=M'       // Store the single parameter in D
        );
        return this;
    };
    
    Code.prototype.saveDToStackAndIncSP = function(){
        this.asm(
            '@SP',
            'M=M+1',
            'A=M-1',
            'M=D'
        );
        return this;
    }

    /**
     * 'base' must be either a numeric base address or a built in
     * symbol (eg. 'R0');
     */
    Code.prototype.loadToDFromSegment = function(base, offset){
        this.asm(
            '@' + base,
            'D=M',
            '@' + offset,
            'A=D+A',
            'D=M'
        );
        return this;
    };

    Code.prototype.saveToSegmentFromD = function(base, offset){
        this.asm(
            '@R13',     // Save D to temp, so that we can calculate the dest
            'M=D',
            '@' + base,
            'D=M',
            '@' + offset,
            'D=D+A',    // D holds dest
            '@R14',
            'M=D',      // R14 holds dest
            '@R13',
            'D=M',
            '@R14',
            'A=M',
            'M=D'
        );
        return this;
    };

    Code.prototype.popToD = function(){
        this.asm(
            '@SP',
            'AM=M-1',
            'D=M'
        );
        return this;
    };

    Code.prototype.incSP = function(){
        this.asm(
            '@SP',
            'M=M+1'
        );
        return this;
    };

    /**
     * Add arbitrary lines of assembly language to the command.
     * 
     * Accepts variable length args.
     */
    Code.prototype.asm = function(){
        var i;
    
        for(i=0; i<arguments.length; i+=1){
            this.commands.push(arguments[i]);
        }
        return this;
    };

    Code.prototype.outputToString = function(){
        return this.commands.join('\n');
    };

    Code.prototype.writeLabel = function(label){
        this.asm(
            '(' + label + ')'
        );
        return this;
    };
    
    /*
     * Writes the assembly code that is the translation of the given arithmentic
     * command.
     */
    Code.prototype.command = function(command){
    
        if(typeof(this[command])==='string'){
            return this[command];
        }
        
        if(typeof(this[command])==='function'){
           return this[command].call(this);
        }
        
        throw new Error('Cannot generate output for command "' + command + '"');
    };

    Code.prototype.add = function(){
        this.shortBinary().asm('M=D+M');
    };
   
    Code.prototype.sub = function(){
        this.shortBinary().asm('M=M-D');
    };
   
    Code.prototype.neg = function(){
        this.unary().asm('M=-D');
    };
   
    Code.prototype.and = function(){
        this.shortBinary().asm('M=D&M');
    };

    Code.prototype.or = function(){
        this.shortBinary().asm('M=D|M');
    };

    Code.prototype.not = function(){
        this.unary().asm('M=!D');
    };
    
    Code.prototype.internalEq = function(){
        this.asm(
            '(INTERNAL_EQ)',
            '@IF_EQ',
            'D;JEQ',

            '@SP',
            'A=M-1',
            'M=0',                              // Output = false
            '@EQ_END',
            '0;JMP',                            // Jump to finish

            '(IF_EQ)',
            '@SP',
            'A=M-1',
            'M=-1',                             // Output = true

            '(EQ_END)',
            '@R13',
            'A=M',
            '0;JEQ'
        );
        return this;
    };

    Code.prototype.eq = function(){
        this.asm(
            '@CONTINUE_EQ_' + this.eqCount,         // Save continue address to R13
            'D=A',
            '@R13',
            'M=D'
        ).shortBinary().asm(
            'D=D-M',                                // Save compare value in D
            
            '@INTERNAL_EQ',                         // Jump to INTERNAL_EQ routine
            '0;JEQ',
            '(CONTINUE_EQ_' + this.eqCount + ')'
        );
        this.eqCount+=1;
    };
    
    Code.prototype.internalGt = function(){
        this.asm(
            '(INTERNAL_GT)',
            '@IF_GT',
            'D;JLT',

            '@SP',
            'A=M-1',
            'M=0',                              // Output = false
            '@GT_END',
            '0;JMP',                            // Jump to finish

            '(IF_GT)',
            '@SP',
            'A=M-1',
            'M=-1',                             // Output = true

            '(GT_END)',
            '@R13',
            'A=M',
            '0;JEQ'
        );
        return this;
    };

    Code.prototype.gt = function(){
        this.asm(
            '@CONTINUE_GT_' + this.gtCount,         // Save continue address to R13
            'D=A',
            '@R13',
            'M=D'
        ).shortBinary().asm(
            'D=D-M',                                // Save compare value in D. GT = True if result < 0.
            
            '@INTERNAL_GT',                         // Jump to INTERNAL_EQ routine
            '0;JEQ',
            '(CONTINUE_GT_' + this.gtCount + ')'
        );
        this.gtCount+=1;
        return this;
    };
    
    Code.prototype.internalLt = function(){
        this.asm(
            '(INTERNAL_LT)',
            '@IF_LT',
            'D;JGT',

            '@SP',
            'A=M-1',
            'M=0',                              // Output = false
            '@LT_END',
            '0;JMP',                            // Jump to finish

            '(IF_LT)',
            '@SP',
            'A=M-1',
            'M=-1',                             // Output = true

            '(LT_END)',
            '@R13',
            'A=M',
            '0;JEQ'
        );
        return this;
    };

    Code.prototype.lt = function(){
        this.asm(
            '@CONTINUE_LT_' + this.ltCount,         // Save continue address to R13
            'D=A',
            '@R13',
            'M=D'
        ).shortBinary().asm(
            'D=D-M',                                // Save compare value in D. GT = True if result < 0.
            
            '@INTERNAL_LT',                         // Jump to INTERNAL_EQ routine
            '0;JEQ',
            '(CONTINUE_LT_' + this.ltCount + ')'
        );
        this.ltCount+=1;
        return this;
    };

    /**
     * Writes the assembly code that is the translation of the given push or pop
     * command.
     */
    Code.prototype.pushPop = function(command, segment, index){
        var callMap;
        
        callMap = {
            'push': {
                'constant': this.pushConstant,
                'temp'    : this.pushTempOrPointer,
                'pointer' : this.pushTempOrPointer,
                'static'  : this.pushStatic,
                'local'   : this.pushOther,
                'argument': this.pushOther,
                'this'    : this.pushOther,
                'that'    : this.pushOther
            },
            'pop' : {
                'temp'    : this.popTempOrPointer,
                'pointer' : this.popTempOrPointer,
                'static'  : this.popStatic,
                'local'   : this.popOther,
                'argument': this.popOther,
                'this'    : this.popOther,
                'that'    : this.popOther
            }
        };
        
        callMap[command][segment].call(this, command, segment, index);
    };
    
    
    /**
     * Outputs optimized assembly code for push constant commands.
     */
    Code.prototype.pushConstant = function(command, segment, index){

        if((index >= 0) & (index <= 2)) {
            
            // Optimized cases:
            //
            // If the constant is a 0, 1 or 2 we can cut down the number
            // of instructions output because we don't need to load the
            // constant into the A register with an @ command.

            this.asm(
                '@SP',           // Load SP
                'M=M+1',         // Increment SP
                'A=M-1'          // Address of value is old SP value
            );

            if((index === 0) || (index === 1)){

                this.asm('M=' + index);

            } else if (index === 2){

                // This is (just) more efficient than loading a constant through
                // the A and D registers.

                this.asm(
                    'M=1',
                    'M=M+1'
                );
            }

        } else {

            // Ordinary case - load the constant through the A and D registers.

            this.asm(
                '@' + index,
                'D=A'
            ).saveDToStackAndIncSP();
        }
    };
    
    Code.prototype.pushTempOrPointer = function(command, segment, index){
        this.asm(
            '@' + (this.baseAddresses[segment] + index),
            'D=M'
        );
        this.saveDToStackAndIncSP();
    };
    
    Code.prototype.pushStatic = function(command, segment, index){
        this.asm(
            '@' + this.fileName + '.' + index,
            'D=M'
        );
        this.saveDToStackAndIncSP();
    };
    
    Code.prototype.pushOther = function(command, segment, index){
        if(this.addressMap[segment] === undefined){
            throw new Error('Undefined segment + "' + segment +'"');
        }
        this.loadToDFromSegment(this.addressMap[segment], index);
        this.saveDToStackAndIncSP();
    };
    
    Code.prototype.popTempOrPointer = function(command, segment, index){
        this.popToD().asm(
            '@' + (this.baseAddresses[segment] + index),
            'M=D'
        );
    };
    
    Code.prototype.popStatic = function(command, segment, index){
        this.popToD().asm(
            '@' + this.fileName + '.' + index,
            'M=D'
        );
    };
    
    Code.prototype.popOther = function(command, segment, index){
        if(this.addressMap[segment] === undefined){
            throw new Error('Undefined segment + "' + segment +'"');
        }
        this.popToD().saveToSegmentFromD(this.addressMap[segment], index);
    };
    

    Code.prototype.setFileName = function(fileName){
        this.fileName = fileName;
    };

    Code.prototype.writeInit = function(){
        this.asm(
            '@256',
            'D=A',
            '@SP',
            'M=D'
        ).writeCall('Sys.init', 0);
        return this;
    };

    Code.prototype.writeGoto = function(label){
        this.asm(
            '@' + label,
            '0;JEQ'
        );
        return this;
    };

    Code.prototype.writeIf = function(label){
        this.popToD().asm(
            '@' + label,
            'D;JNE'
        );
        return this;
    };
    
    
    Code.prototype.writeCallInternal = function(){
        var pushes, i;
        
        pushes = ['LCL', 'ARG', 'THIS', 'THAT'];
    
        this.asm(
            '(CALL)'                   // Label for the CALL routine
        );
        
        // D holds return address by convention (see writeCall). Push this
        // onto the stack.
        this.saveDToStackAndIncSP();
    
        for(i=0; i<pushes.length; i+=1){
            this.asm(
                '@' + pushes[i],
                'D=M'
            ).saveDToStackAndIncSP();
        }
    
        this.asm(
            '@SP',                      // Reposition ARG
            'D=M',
            '@13',                      // Num args
            'D=D-M',
            '@5',
            'D=D-A',
            '@ARG',
            'M=D',
        
            '@SP',                      // Reposition LCL
            'D=M',
            '@LCL',
            'M=D',
        
            '@14',                      // Function address
            'A=M',
            '0;JEQ'
        );
        
        return this;
    };

    Code.prototype.writeCall = function(functionName, numArgs){
        var returnAddress;
    
        returnAddress = 'return-' + this.functionCallCount;
        this.functionCallCount+=1;
        
        this.asm(
            '@' + numArgs,              // Num args lands in R13
            'D=A',
            '@R13',
            'M=D',
            
            '@' + functionName,         // Function address lands in R14
            'D=A',
            '@R14',
            'M=D',
            
            '@' + returnAddress,        // Return address lands in D
            'D=A',
            
            '@CALL',
            '0;JEQ',
            '(' + returnAddress + ')'
        );
    
        return this;
    };

    Code.prototype.writeReturnInternal = function(){
        this.asm(
            '(RETURN)',
            '@LCL',
            'D=M',
            '@R13',
            'M=D',              // R13 holds value of LCL (or FRAME)
            '@5',
            'A=D-A',            // Address of the return address in the frame
            'D=M',              // Dereference return address
            '@R14',
            'M=D'               // R14 holds return address
        )
        .popToD()
        .asm(
            '@ARG',             // Reposition return value for the caller.
            'A=M',
            'M=D',
        
            '@ARG',             // Restore SP of the caller
            'A=M+1',
            'D=A',
            '@SP',
            'M=D',
        
            '@R13',             // Restore THAT of the caller
            'D=M',
            '@1',
            'A=D-A',
            'D=M',
            '@THAT',
            'M=D',
        
            '@R13',             // Restore THIS of the caller
            'D=M',
            '@2',
            'A=D-A',
            'D=M',
            '@THIS',
            'M=D',
        
            '@R13',             // Restore ARG of the caller
            'D=M',
            '@3',
            'A=D-A',
            'D=M',
            '@ARG',
            'M=D',
        
            '@R13',             // Restore LCL of the caller
            'D=M',
            '@4',
            'A=D-A',
            'D=M',
            '@LCL',
            'M=D',
        
            '@R14',             // Jump to return address of caller.
            'A=M',
            '0;JEQ'
        );
        return this;
    };
    
    Code.prototype.writeReturn = function(){
        this.asm(
            '@RETURN',
            '0;JEQ'
        );
        return this;
    };
    
    Code.prototype.writeFunction = function(functionName, numLocals){
        var i;
    
        this.writeLabel(functionName);
    
        for(i=0; i<numLocals; i+=1){
            this.asm(
                '@SP',
                'A=M',
                'M=0'
            ).incSP();
        }
        return this;
    };
    
    Code.prototype.writeInternals = function(){
        this.asm(
            
            // Make sure the program doesn't try to execute the internal
            // functions without an explicit jump
            
            '@END_INTERNAL_FUNCTIONS',      // Load end address and skip the interals
            '0;JEQ'
            ).writeCallInternal()
            .writeReturnInternal()
            .internalEq()
            .internalGt()
            .internalLt()
            .asm(
                '(END_INTERNAL_FUNCTIONS)'
        );
        return this;
    };


    function VMTranslator(inputFiles, outputFile, skipInit){
        this.inputFiles = inputFiles;
        this.outputFile = outputFile;
        this.skipInit = skipInit;
        
        this.lineCount = 0;
        this.encoding = 'ascii';
        this.outputFD = null;
        this.code = null;
    }
    
    
    VMTranslator.prototype.run = function(){
        var i, inputFile, lineReader, parser, code, outputFD;
        
        this.outputFD = fs.openSync(this.outputFile, "w");
        this.code = new Code();
        this.writeInitial();
        
        for(i=0; i<this.inputFiles.length; i+=1){
            
            inputFile = this.inputFiles[i];
        
            lineReader = new lr.LineReader(inputFile);
            parser = new Parser(lineReader);
        
            lineReader.open();

            this.code.setFileName(path.basename(inputFile, '.vm'));
            
            callMap = {
                C_ARITHMETIC:
                    function(){
                        this.code.command(parser.commandParts[0]);
                    },

                C_PUSH:
                    function(){
                        this.code.pushPop(parser.commandParts[0],
                                parser.commandParts[1], parseInt(parser.commandParts[2], 10));
                    },

                C_POP:
                    function(){
                        this.code.pushPop(parser.commandParts[0],
                                parser.commandParts[1], parseInt(parser.commandParts[2], 10));
                    },
                C_LABEL:
                    function(){
                        this.code.writeLabel(parser.commandParts[1]);
                    },

                C_GOTO:
                    function(){
                        this.code.writeGoto(parser.commandParts[1]);
                    },

                C_IF:
                    function(){
                        this.code.writeIf(parser.commandParts[1]);
                    },

                C_FUNCTION:
                    function(){
                        this.code.writeFunction(parser.commandParts[1], parser.commandParts[2]);
                    },

                C_RETURN:
                    function(){
                        this.code.writeReturn();
                    },

                C_CALL:
                    function(){
                        this.code.writeCall(parser.commandParts[1], parser.commandParts[2]);
                    }
            };

            while(parser.hasMoreCommands()){
                parser.advance();
                this.code.newCommand();
                
                callMap[parser.commandType()].call(this);
                
                this.formatCommand(this.code.commands, parser.currentCommand);
            }
            lineReader.close();
        }
        fs.closeSync(this.outputFD);
    };
    
    VMTranslator.prototype.writeInitial = function(){
        if(!this.skipInit){
            this.formatCommand(this.code.newCommand().writeInit().commands, 'Init');
        }
        this.formatCommand(this.code.newCommand().writeInternals().commands, 'VM Internals');
    };
    
    VMTranslator.prototype.formatCommand = function(commands, commandName){
        var i, asmString, outString;
        
        for(i=0; i<commands.length; i+=1){
            asmString = commands[i];
            
            if( (asmString.charAt(0) === '(' && asmString.charAt(asmString.length -1) === ')') ){
                outString = this.pad(asmString, 60) + ' // [' + this.pad('', 5) + '] ' + commandName;
                fs.writeSync(this.outputFD, outString + '\n', null, this.encoding);
                
            } else {
                outString = this.pad(asmString, 60) + ' // [' + this.pad(this.lineCount.toString(), 5) + '] ' + commandName;
                fs.writeSync(this.outputFD, outString + '\n', null, this.encoding);
                this.lineCount += 1;
            }
        }
    };
    
    VMTranslator.prototype.pad = function(s, amount){
        while(s.length < amount){
            s += ' ';
        }
        return s;
    };
    
    
    exports.Code = Code;
    
    (function(){
        var stats, inputFiles, fileOrDir, basename, outputFile, argv, vmtranslator;
        
        /*
         * Configure and run the VMTranslator if run as a script.
         */
        if(require.main === module){
            argv = optimist.usage('VM language translator for hack platform VM.\n\nUsage: $0 [file or directory]')
                            .boolean(['s'])
                            .default('s', false)
                            .alias('s', 'skip-init')
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
                    inputFiles = glob.sync(fileOrDir + '**/*.vm');
                    outputFile = path.join(fileOrDir, path.basename(fileOrDir)) + '.asm';

                } else {
                    inputFiles = [fileOrDir];
                    outputFile = path.join(path.dirname(fileOrDir), path.basename(fileOrDir, '.vm')) + '.asm';
                }
                vmtranslator = new VMTranslator(inputFiles, outputFile, argv.s)
                vmtranslator.run();
                
                process.exit(0);
            }
        }
    }());
}());