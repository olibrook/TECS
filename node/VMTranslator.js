#!/usr/bin/env node

/*
Implementation notes:

Command format
--------------
Each VM command is of the format:

    - 'command' (eg. add)
    - 'command arg' (eg. goto loop), or
    - 'command arg1 arg2' (eg. push local 3)

Commands are seperated from their args by an arbitrary number of
spaces. Comments are '//' to the end of the line.

Data types
----------

- One 16 bit data type which can represent ints, booleans or pointers.
    - True == 0xFFFF (-1)
    - False == 0x0000 (0)

Commands
--------

Arithmetic and logical commands
+++++++++++++++++++++++++++++++


9 stack-based commands are supported, 2 binary, 2 unary. Commands pop
args off the stack and push results onto the stack.

Commands are as follows:

Command     Function        
-------------------------------------
add         x + y
sub         x - y
neg         -y
eq          x == y
gt          x > y
lt          x < y
and         x && y (bitwise)
or          x || y (bitwise)
not         ! y    (bitwise)


Memory access commands
++++++++++++++++++++++

- push [segment] [index], pushes the value from the segment[index]
  onto the stack.
- pop [segment] [index], pops the value from the stack and stores it
  in segment[index]

RAM Usage
---------

Addresses       Usage
-------------------------
0-15            16 Virtual registers
16-255          Static variables of all the functions in the VM program
255-2047        Stack
2048-16483      Heap
16384-24575     Memory-mapped IO


Implementation
--------------

Stage I: Stack arithmetic commands: The first version of your VM translator should
implement the nine stack arithmetic and logical commands of the VM language as well
as the “push constant x” command (which, among other things, will help testing the
nine former commands). Note that the latter is the generic push command for the
special case where the first argument is “constant” and the second argument is
some decimal constant.

Stage II: Memory access commands: The next version of your translator should include
a full implementation of the VM language's push and pop commands, handling all eight
memory segments. We suggest breaking this stage into the following sub-stages:

   0. You have already handled the constant segment;
   1. Next, handle the segments local, argument, this, and that;
   2. Next, handle the pointer and temp segments, in particular allowing modification
      of the bases of the this and that segments;
   3. Finally, handle the static segment.

*/

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


Parser.prototype = {
    
    /*
     * Returns true if there are more commands in the input.
     */
    hasMoreCommands: function(){
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
    advance: function(){
        this.currentCommand = this.currentLine;
        this.currentLine = '';
        this.commandParts = this.currentCommand.match(/^\s*(\S+)?\s*(\S+)?\s*(\S+)?/).slice(1);
        this.currentCommandType = this._commandType();
    },
    
    /*
     * Returns the type of the current command as a string.
     */
    commandType: function(){
        return this.currentCommandType;
    },
    
    _commandType: function(){
        var command, formats, requiredLength, i, re, commandType, partsLength;
        
        command = this.commandParts[0];
        
        formats = [
            [1, /^(add|sub|neg|eq|gt|lt|and|or|not)$/, C_ARITHMETIC],
            [3, /^push$/, C_PUSH],
            [3, /^pop$/, C_POP],
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
    arg1: function(){
        return this.commandParts[1];
    },
    
    /*
     * Returns the second argument of the current command as an integer.
     */
    arg2: function(){
        if(!this.commandParts[2].match(/^[0-9]+$/)){
            throw new Error("Cannot parse '" + this.commandParts[2] + "' as an integer.");
        } else {
            return parseInt(this.commandParts[2], 10);
        }
    }
}




/**
 * Code generator class for arithmetic commands.
 */
function Arithmetic(commandCount){
    this.commands = [];
    this.commandCount = commandCount;
}

/**
 * Common setup for binary commands.
 */
Arithmetic.prototype.binary = function(){
    this.commands = this.commands.concat([
        '@SP',      // Load the address of the SP
        'AM=M-1',   // Decrement the SP
        'D=M',      // Load the second parameter into D 
        '@SP',
        'AM=M-1'    // Decrement SP and leave A with the address of the first parameter
    ]);
    return this;
}

/**
 * Common setup for unary commands.
 */
Arithmetic.prototype.unary = function(){
    this.commands = this.commands.concat([
        '@SP',      // Load the address of the SP
        'AM=M-1',   // Load the address of the value it points to
        'D=M'       // Store the single parameter in D
    ]);
    return this;
}

Arithmetic.prototype.incSP = function(){
    this.commands = this.commands.concat([
        '@SP',
        'M=M+1'
    ]);
    return this;
}

Arithmetic.prototype.add = function(){
    this.commands.push('M=D+M');
    return this;
}

Arithmetic.prototype.sub = function(){
    this.commands.push('M=M-D');
    return this;
}

Arithmetic.prototype.neg = function(){
    this.commands.push('M=-D');
    return this;
}

Arithmetic.prototype.eq = function(){
    this.commands = this.commands.concat([
        'D=D-M',                            // Subtract one from the other. Equal if result == 0.
        '@IF_EQ_' + this.commandCount,
        'D;JEQ',
        
        '@SP',
        'A=M',
        'M=0',                              // Output = false
        '@EQ_END_' + this.commandCount,
        '0;JMP',                            // Jump to finish
        
        '(IF_EQ_' + this.commandCount + ')',
        '@SP',
        'A=M',
        'M=-1',                             // Output = true
        
        '(EQ_END_' + this.commandCount + ')'     // Finish
    ]);
    return this;
}

Arithmetic.prototype.gt = function(){
    this.commands = this.commands.concat([
        'D=D-M',                            // Subtract first from second. GT = True if result < 0.

        '@IF_GT_' + this.commandCount,
        'D;JLT',
        
        '@SP',
        'A=M',
        'M=0',                              // Output = false
        '@GT_END_' + this.commandCount,
        '0;JMP',                            // Jump to finish
        
        '(IF_GT_' + this.commandCount + ')',
        '@SP',
        'A=M',
        'M=-1',                             // Output = true
        
        '(GT_END_' + this.commandCount + ')'     // Finish
    ]);
    return this;
}

Arithmetic.prototype.lt = function(){
    this.commands = this.commands.concat([
        'D=D-M',                            // Subtract first from second. LT = True if result > 0.
        
        '@IF_LT_' + this.commandCount,
        'D;JGT',
        
        '@SP',
        'A=M',
        'M=0',                              // Output = false
        '@LT_END_' + this.commandCount,
        '0;JMP',                            // Jump to finish
        
        '(IF_LT_' + this.commandCount + ')',
        '@SP',
        'A=M',
        'M=-1',                             // Output = true
        
        '(LT_END_' + this.commandCount + ')'// Finish
    ]);
    return this;
}

Arithmetic.prototype.and = function(){
    this.commands.push('M=D&M');
    return this;
}

Arithmetic.prototype.or = function(){
    this.commands.push('M=D|M');
    return this;
}

Arithmetic.prototype.not = function(){
    this.commands.push('M=!D');
    return this;
}

Arithmetic.prototype.out = function(){
    return this.commands.join('\n');
}





function Code(){
    
    // Used to generate unique labels for branching commands.
    this.eqCount = 0;
    this.ltCount = 0;
    this.gtCount = 0;
    
    this.arithmeticCommands = {
        
        add: new Arithmetic(0).binary().add().incSP().out(),
        
        sub: new Arithmetic(0).binary().sub().incSP().out(),
        
        neg: new Arithmetic(0).unary().neg().incSP().out(),
        
        and: new Arithmetic(0).binary().and().incSP().out(),
        
        or:  new Arithmetic(0).binary().or().incSP().out(),
        
        not: new Arithmetic(0).unary().not().incSP().out(),
        
        eq:  function(){
                return new Arithmetic(this.eqCount++).binary().eq().incSP().out();
        },

        gt:  function(){
                return new Arithmetic(this.gtCount++).binary().gt().incSP().out();
        },

        lt:  function(){
                return new Arithmetic(this.ltCount++).binary().lt().incSP().out();
        }
    }   
}

Code.prototype = {
    
    /*
     * Writes the assembly code that is the translation of the given arithmentic
     * command.
     */
     command: function(command){
         var out = this.arithmeticCommands[command];
         
         if(typeof(out)==='string'){
             return out;
             
         } else if(typeof(out)==='function'){
            return out.call(this);
             
         } else {
             throw new Error('Cannot generate output for command "' + command + '"');
         }
     },
     
     /*
      * Writes the assembly code that is the translation of the given push or pop
      * command.
      */
    pushPop: function(command, segment, index){
        var out, incrementStack, saveDToStack;
        
        out = [];
        
        incrementStack = [
            '@SP',
            'M=M+1',
        ];
        
        saveDToStack = [
            '@SP',
            'A=M',
            'M=D'
        ];
        
        if(command === 'push'){
            switch(segment){
                
                case 'constant':
                    out = out.concat([
                        '@' + index,        // Load constant
                        'D=A',
                    ]);
                    out = out.concat(saveDToStack);
                    out = out.concat(incrementStack);
                    break;
                    
                default:
                    throw new Error('Push to unimplemented segment.');
            }
            
        } else if(command === 'pop'){
            
        } else {
            throw new Error('Invalid command in pushPop.');
        }
        
        
        return out.join('\n');
    }
}


function main(inputFile, outputFile){
    
    var lineReader = new lr.LineReader(inputFile),
        parser = new Parser(lineReader),
        code = new Code();
        
    lineReader.open();

    while(parser.hasMoreCommands()){
        parser.advance();
        
        console.log('\n// ' + parser.currentCommand + '\n');
        
        switch(parser.commandType()){
            case C_ARITHMETIC:
                console.log(code.command(parser.commandParts[0]));
                break;
            case C_PUSH:
            case C_POP:
                console.log(code.pushPop(parser.commandParts[0], parser.commandParts[1], parser.commandParts[2]));
                break;
            case C_LABEL:
            case C_GOTO:
            case C_IF:
            case C_FUNCTION:
            case C_RETURN:
            case C_CALL:
            default:
                console.log(new Error("Unknown command type: '" + parser.commandType() + "'"));
                break;
        }
    }
    
    lineReader.close();
}


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
            var stats, inputFiles, fileOrDir;

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
                inputFiles = glob.sync('**/*.vm', {cwd: fileOrDir});

            } else {
                inputFiles = [fileOrDir];
            }

            for (var i=0; i<inputFiles.length; i++) {
                var inputFile = inputFiles[i],
                    outputFile = path.join(
                        path.dirname(inputFile), path.basename(inputFile, '.vm')) + '.asm';
                main(inputFile, outputFile);
            }
            
            process.exit(0);
        })();
    }
}