#!/usr/bin/env node

(function(){
    var optimist = require('optimist'),
        fs = require('fs'),
        path = require('path'),
        jackTokenizer = require('./jacktokenizer'),
        glob = require('glob'),
    
        stats,
        inputFileNames,
        fileOrDir,
        basename,
        outputFileName,
        argv;
    
    function main(files){

        var source,
            tokenizer,
            tokenType,
            value,
            prettyTokenType,
            outputFileName,
            outputFile,
            inputFileName,
            inputFile,
            i,
            out,
            encoding;
        
        encoding = 'ascii';
        
        for(i=0; i<files.length; i++){
            
            inputFileName = files[i];
            source = fs.readFileSync(inputFileName, encoding);
                        
            outputFileName = path.join(path.dirname(inputFileName), path.basename(inputFileName)) + '.xml';
            outputFile = fs.openSync(outputFileName, "w");
            
            tokenizer = new jackTokenizer.Tokenizer(source);
            
            fs.writeSync(outputFile, '<tokens>\n', null, encoding);
            
            while(tokenizer.hasNext()){
                tokenizer.next();
                tokenType = tokenizer.tokenType();

                switch(tokenType){
                    case 'KEYWORD':
                        value = tokenizer.keyWord();
                        prettyTokenType = 'keyword';
                        break;

                    case 'SYMBOL':
                        value = tokenizer.symbol();
                        prettyTokenType = 'symbol';
                        break;

                    case 'IDENTIFIER':
                        value = tokenizer.identifier();
                        prettyTokenType = 'identifier';
                        break;

                    case 'INT_CONST':
                        value = tokenizer.intVal();
                        prettyTokenType = 'integerConstant';
                        break;

                    case 'STRING_CONST':
                        value = tokenizer.stringVal();
                        prettyTokenType = 'stringConstant';
                        break;

                    default:
                        throw new Error('Unknown token type: "' + 
                                tokenType +'"');
                }
                
                out = '<' + prettyTokenType + '> ';
                out += value.toString()
                        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                out += ' </' + prettyTokenType + '>\n';
                
                fs.writeSync(outputFile, out, null, encoding);
            }
            
            fs.writeSync(outputFile, '</tokens>\n', null, encoding);
            fs.closeSync(outputFile);
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
            
            main(inputFileNames);
            process.exit(0);
        }
    }
}());