#!/usr/bin/env node

var lr = require('./linereader'),
    optimist = require('optimist'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path');


C_ARITHMETIC = 'C_ARITHMETIC';
C_PUSH = 'C_PUSH';
C_POP = 'C_POP';
C_LABEL = 'C_LABEL';
C_GOTO = 'C_GOTO';
C_IF = 'C_IF';
C_FUNCTION = 'C_FUNCTION';
C_RETURN = 'C_RETURN';
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
        this.currentLine = this.currentLine.replace(/\/\/.+/, '');
    }
    // Return true if line not empty.
    return (this.currentLine.match(/\S/));
},

/*
 * Reads the next command and makes it the current command.
 */
Parser.prototype.advance = function(){
    this.currentCommand = this.currentLine;
    this.currentLine = '';
    this.commandParts = this.currentCommand.match(/^\s*(\S+)?\s*(\S+)?\s*(\S+)?/).slice(1);
    this.currentCommandType = this._commandType();
},

/*
 * Returns the type of the current command as a string.
 */
Parser.prototype.commandType = function(){
    return this.currentCommandType;
},

Parser.prototype._commandType = function(){
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
            return item !== undefined
        }).length;
    
    for(i=0; i<formats.length; i++){
        requiredLength = formats[i][0];
        re = formats[i][1];
        commandType = formats[i][2];
        
        if(command.match(re) && partsLength == requiredLength){
            return commandType;
        }
    }
    
    throw new Error("Parser error");
},

/*
 * Returns the first argument of the current command as a string.
 */
Parser.prototype.arg1 = function(){
    return this.commandParts[1];
},

/*
 * Returns the second argument of the current command as an integer.
 */
Parser.prototype.arg2 = function(){
    if(!this.commandParts[2].match(/^[0-9]+$/)){
        throw new Error("Cannot parse '" + this.commandParts[2] + "' as an integer.");
    } else {
        return parseInt(this.commandParts[2], 10);
    }
}

/**
 * Represents a bunch of Hack Assembly language commands.
 */
function Assembly(){
    this.commands = [];
}

/**
 * Common setup for binary commands.
 */
Assembly.prototype.binary = function(){
    this.asm(
        '@SP',      // Load the address of the SP
        'AM=M-1',   // Decrement the SP
        'D=M',      // Load the second parameter into D 
        '@SP',
        'AM=M-1'    // Decrement SP and leave A with the address of the first parameter
    );
    return this;
}

/**
 * Common setup for unary commands.
 */
Assembly.prototype.unary = function(){
    this.asm(
        '@SP',      // Load the address of the SP
        'AM=M-1',   // Load the address of the value it points to
        'D=M'       // Store the single parameter in D
    );
    return this;
}

Assembly.prototype.saveDToStack = function(){
    this.asm(
        '@SP',
        'A=M',
        'M=D'
    );
    return this;
}

/**
 * 'base' must be either a numeric base address or a built in
 * symbol (eg. 'R0');
 */
Assembly.prototype.loadToDFromSegment = function(base, offset){
    this.asm(
        '@' + base,
        'D=M',
        '@' + offset,
        'A=D+A',
        'D=M'
    );
    return this;
}

Assembly.prototype.saveToSegmentFromD = function(base, offset){
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
    )
    return this;
}

Assembly.prototype.popToD = function(){
    this.asm(
        '@SP',
        'AM=M-1',
        'D=M'
    );
    return this;
}

Assembly.prototype.incSP = function(){
    this.asm(
        '@SP',
        'M=M+1'
    );
    return this;
}

/**
 * Add arbitrary lines of assembly language to the command.
 * 
 * Accepts variable length args.
 */
Assembly.prototype.asm = function(){
    for(var i=0; i<arguments.length; i++){
        this.commands.push(arguments[i]);
    }
    return this;
}

Assembly.prototype.toString = function(){
    return this.commands.join('\n');
};

Assembly.prototype.writeLabel = function(label){
    this.asm(
        '(' + label + ')'
    );
    return this;
};


function Code(){
    
    // Used to generate unique labels for branching commands.
    this.eqCount = 0;
    this.ltCount = 0;
    this.gtCount = 0;
    
    // Used to generate labels for the static segment.
    this.fileName = null;
}

/*
 * Writes the assembly code that is the translation of the given arithmentic
 * command.
 */
Code.prototype.command = function(command){
    
    if(typeof(this[command])==='string'){
        return this[command];
        
    } else if(typeof(this[command])==='function'){
       return this[command].call(this);
        
    } else {
        throw new Error('Cannot generate output for command "' + command + '"');
    }
};

Code.prototype.add = function(){
    return new Assembly().binary().asm('M=D+M').incSP();
}
   
Code.prototype.sub = function(){
    return new Assembly().binary().asm('M=M-D').incSP();
}
   
Code.prototype.neg = function(){
    return new Assembly().unary().asm('M=-D').incSP();
}
   
Code.prototype.and = function(){
    return new Assembly().binary().asm('M=D&M').incSP();
}

Code.prototype.or = function(){
    return new Assembly().binary().asm('M=D|M').incSP();
}

Code.prototype.not = function(){
    return new Assembly().unary().asm('M=!D').incSP();
}

Code.prototype.eq = function(){
    var command = new Assembly().binary().asm(
        'D=D-M',                            // Subtract one from the other. Equal if result == 0.
        '@IF_EQ_' + this.eqCount,
        'D;JEQ',

        '@SP',
        'A=M',
        'M=0',                              // Output = false
        '@EQ_END_' + this.eqCount,
        '0;JMP',                            // Jump to finish

        '(IF_EQ_' + this.eqCount + ')',
        '@SP',
        'A=M',
        'M=-1',                             // Output = true

        '(EQ_END_' + this.eqCount + ')'        // Finish
        
        ).incSP();
    
    this.eqCount++;
    return command;
},

Code.prototype.gt = function(){
    var command = new Assembly().binary().asm(
        'D=D-M',                            // Subtract first from second. GT = True if result < 0.

        '@IF_GT_' + this.gtCount,
        'D;JLT',

        '@SP',
        'A=M',
        'M=0',                              // Output = false
        '@GT_END_' + this.gtCount,
        '0;JMP',                            // Jump to finish

        '(IF_GT_' + this.gtCount + ')',
        '@SP',
        'A=M',
        'M=-1',                             // Output = true

        '(GT_END_' + this.gtCount + ')'     // Finish
        
        ).incSP();

    this.gtCount++;
    return command;
}

Code.prototype.lt = function(){
    var command = new Assembly().binary().asm( 
        'D=D-M',                            // Subtract first from second. LT = True if result > 0.

        '@IF_LT_' + this.ltCount,
        'D;JGT',

        '@SP',
        'A=M',
        'M=0',                              // Output = false
        '@LT_END_' + this.ltCount,
        '0;JMP',                            // Jump to finish

        '(IF_LT_' + this.ltCount + ')',
        '@SP',
        'A=M',
        'M=-1',                             // Output = true

        '(LT_END_' + this.ltCount + ')'    // Finish
        ).incSP();
        
    this.ltCount++;
    return command;
}

/**
 * Writes the assembly code that is the translation of the given push or pop
 * command.
 */
Code.prototype.pushPop = function(command, segment, index){
    var assembly, addressMap, baseAddresses;
    
    addressMap = {
        'local': 'R1',
        'argument': 'R2',
        'this': 'R3',
        'that': 'R4',
    }
    
    baseAddresses = {
        'temp': 5,
        'pointer': 3
    }
    
    assembly = new Assembly();
    
    switch(command){
        
        case 'push':
            
            switch(segment){
                
                case 'constant':
                    assembly.asm(
                        '@' + index,        // Load constant
                        'D=A'
                        );
                    break;
                
                case 'temp':
                case 'pointer':
                    assembly.asm(
                        '@' + (baseAddresses[segment] + index),
                        'D=M'
                    );
                    break;
                    
                case 'static':
                    assembly.asm(
                        '@' + this.fileName + '.' + index,
                        'D=M'
                    );
                    break;
                
                default:
                    if(addressMap[segment] === undefined){
                        throw new Error('Undefined segment + "' + segment +'"');
                    }
                    else {
                        assembly.loadToDFromSegment(addressMap[segment], index);
                    }
                    break;
                    
            }
            return assembly.saveDToStack().incSP();
            
        case 'pop':
            
            assembly.popToD();
            
            switch(segment){
            
                case 'temp':
                case 'pointer':
                    assembly.asm(
                        '@' + (baseAddresses[segment] + index),
                        'M=D'
                    );
                    break;
                
                case 'static':
                    assembly.asm(
                        '@' + this.fileName + '.' + index,
                        'M=D'
                    );
                    break;
                
                default:
                    if(addressMap[segment] === undefined){
                        throw new Error('Undefined segment + "' + segment +'"');
                    } else {
                        assembly.saveToSegmentFromD(addressMap[segment], index);
                    }
                    break;
            }
            return assembly;
            break;
    }
};

Code.prototype.setFileName = function(fileName){
    this.fileName = fileName;
};

Code.prototype.writeInit = function(){
    
};

Code.prototype.writeLabel = function(label){
    return new Assembly().writeLabel(label);
};

Code.prototype.writeGoto = function(label){
    return new Assembly().asm(
        '@' + label,
        '0;JEQ'
    );
};

Code.prototype.writeIf = function(label){
    return new Assembly().popToD().asm(
        '@' + label,
        'D;JNE'
    );
};

Code.prototype.writeCall = function(functionName, numArgs){
    
};

Code.prototype.writeReturn = function(){
    var assembly = new Assembly().asm(
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
    
    return assembly;
};

Code.prototype.writeFunction = function(functionName, numLocals){
    var assembly = new Assembly().writeLabel(functionName);
    
    for(var i=0; i<numLocals; i++){
        assembly.asm(
            '@SP',
            'A=M',
            'M=0'
        ).incSP();
    };
    return assembly;
};



function main(inputFiles, outputFile){

    var lineReader, parser, code, assembly, lineCount, inputFile;
    
    lineCount = 0;
    code = new Code();
    
    for(var i=0; i<inputFiles.length; i++){
        inputFile = inputFiles[i];
        
        lineReader = new lr.LineReader(inputFile);
        parser = new Parser(lineReader);
        
        lineReader.open();

        code.setFileName(path.basename(inputFile, '.vm'));

        while(parser.hasMoreCommands()){
            parser.advance();

            switch(parser.commandType()){
                case C_ARITHMETIC:
                    assembly = code.command(parser.commandParts[0]);
                    break;
                case C_PUSH:
                case C_POP:
                    assembly = code.pushPop(parser.commandParts[0], parser.commandParts[1], parseInt(parser.commandParts[2]));
                    break;
                case C_LABEL:
                    assembly = code.writeLabel(parser.commandParts[1]);
                    break;
                case C_GOTO:
                    assembly = code.writeGoto(parser.commandParts[1]);
                    break;
                case C_IF:
                    assembly = code.writeIf(parser.commandParts[1]);
                    break;
                case C_FUNCTION:
                    assembly = code.writeFunction(parser.commandParts[1], parser.commandParts[2]);
                    break;
                case C_RETURN:
                    assembly = code.writeReturn();
                    break;
                case C_CALL:
                default:
                    throw new Error("Unknown command type: '" + parser.commandType() + "'");
                    break;
            }

            console.log('\n// ' + parser.currentCommand + '\n');
            
            for(var j=0; j<assembly.commands.length; j++){
                while(assembly.commands[j].length < 80){
                    assembly.commands[j] += ' ';
                }
                console.log(assembly.commands[j] + '// ' + lineCount++);
            }
        }
        lineReader.close();
    }
}

exports.Code = Code;


/*
 * Configure and run the VMTranslator if run as a script.
 */
if(require.main === module){
    var argv = optimist.usage('VM language translator for hack platform VM.\n\nUsage: $0 [file or directory]')
                    .argv;

    if (argv.h || argv.help) {
            optimist.showHelp();
            process.exit(0);

    } else {
        (function(){
            var stats, inputFiles, fileOrDir, basename, outputFile;

            if(argv._.length == 0) {
                fileOrDir = process.cwd();
                
            } else if(argv._.length == 1) {
                fileOrDir = argv._[0];
                
            } else {
                optimist.showHelp();
                process.exit(1);
            }
            stats = fs.statSync(fileOrDir);

            if(stats.isDirectory()) {
                inputFiles = glob.sync(fileOrDir + '**/*.vm');
                outputFile = path.join(path.dirname(fileOrDir), path.basename(fileOrDir)) + '.asm';

            } else {
                inputFiles = [fileOrDir];
                outputFile = path.join(path.dirname(fileOrDir), path.basename(fileOrDir, '.vm')) + '.asm';
            }
            
            main(inputFiles, outputFile);
            process.exit(0);
        })();
    }
}