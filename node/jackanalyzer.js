#!/usr/bin/env node

(function(){
        
    var optimist = require('optimist'),
        fs = require('fs'),
        path = require('path'),
        jackTokenizer = require('./jacktokenizer'),
        compilationengine = require('./compilationengine'),
        symbolTable = require('./symboltable'),
        glob = require('glob'),
        
        encoding = 'ascii',
        
        stats,
        inputFileNames,
        fileOrDir,
        basename,
        outputFileName,
        argv,
        
        Out;
    
    
    // Used to redirect parser/tokenizer output.
    Out = function(){};
    // Out.prototype.write = console.log;

    Out.prototype.write = function(str){
            fs.writeSync(this.fd, str + '\n', null, encoding);
    };
    
    function tokenize(files){

        var source,
            tokenizer,
            tokenType,
            value,
            outputFileName,
            outputFile,
            inputFileName,
            inputFile,
            i,
            output,
            out,
            methodName;
        
        out = new Out();
        
        
        for(i=0; i<files.length; i+=1){
            
            inputFileName = files[i];
            source = fs.readFileSync(inputFileName, encoding);
                        
            outputFileName = path.join(path.dirname(inputFileName), path.basename(inputFileName)) + '.tokenized.xml';
            out.fd = fs.openSync(outputFileName, "w");
            
            tokenizer = new jackTokenizer.Tokenizer(source);
            
            out.write('<tokens>');
            
            while(tokenizer.hasNext()){
                tokenizer.next();
                tokenType = tokenizer.tokenType();
                methodName = tokenizer.methodMap[tokenType];
                value = tokenizer[methodName]();
                
                output = '<' + tokenType + '> ';
                output += value.toString()
                        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                output += ' </' + tokenType + '>';
                
                out.write(output);
            }
            
            out.write('</tokens>');
            fs.closeSync(out.fd);
        }
    }
    
    
    
    function compile(files){
        
        var source,
            tokenizer,
            compilationEngine,
            outputFileName,
            outputFile,
            inputFileName,
            inputFile,
            i,
            out;
        
        out = new Out();
        
        for(i=0; i<files.length; i+=1){
            
            inputFileName = files[i];
            source = fs.readFileSync(inputFileName, encoding);
            
            outputFileName = path.join(path.dirname(inputFileName), path.basename(inputFileName, '.jack')) + '.vm';
            out.fd = fs.openSync(outputFileName, "w");
            
            tokenizer = new jackTokenizer.Tokenizer(source);
            
            compilationEngine = new compilationengine.CompilationEngine();
            compilationEngine.main(tokenizer, out, new symbolTable.SymbolTable(), true);
            
            fs.closeSync(out.fd);
        }
    }
    
    
    if(require.main === module){
        argv = optimist.usage('Syntax analyzer for the Jack programming language.\n\nUsage: $0 [file or directory]')
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
                inputFileNames = glob.sync(fileOrDir + '**/*.jack');

            } else {
                inputFileNames = [fileOrDir];
            }
            
            compile(inputFileNames);
            
            process.exit(0);
        }
    }
}());