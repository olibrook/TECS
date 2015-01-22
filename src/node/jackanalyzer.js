#!/usr/bin/env node

(function(){

    var optimist = require('optimist'),
        fs = require('fs'),
        path = require('path'),
        glob = require('glob'),

        jackTokenizer = require('./jacktokenizer'),
        compilationenginev1 = require('./compilationenginev1'),
        compilationenginev2 = require('./compilationenginev2'),
        symbolTable = require('./symboltable'),

        encoding = 'ascii',

        stats,
        inputFileNames,
        fileOrDir,
        argv;


    /**
     * Simple file output with sync-only methods.
     */
    function Out(fileName, mode){
        this.fd = fs.openSync(fileName, mode);
    }

    Out.prototype.write = function(str){
        fs.write(this.fd, str + '\n', null, encoding);
    };

    Out.prototype.close = function(){
        fs.close(this.fd);
    };


    function tokenize(files){
        var source,
            tokenizer,
            tokenType,
            value,
            outputFileName,
            inputFileName,
            i,
            output,
            methodName,
            out;

        for(i=0; i<files.length; i+=1){
            inputFileName = files[i];
            source = fs.readFileSync(inputFileName, encoding);

            outputFileName = path.join(path.dirname(inputFileName), path.basename(inputFileName)) + '.tokenized.xml';

            out = new Out(outputFileName, "w");

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
            out.close();
        }
    }

    function compile(files, compilationEngine, extension){
        var source,
            outputFileName,
            inputFileName,
            i,
            out;

        for(i=0; i<files.length; i+=1){
            inputFileName = files[i];
            source = fs.readFileSync(inputFileName, encoding);

            outputFileName = path.join(
                path.dirname(inputFileName),
                path.basename(inputFileName, '.jack')
            ) + '.' + extension;

            out = new Out(outputFileName, "w");

            compilationEngine.main(
                new jackTokenizer.Tokenizer(source),
                out,
                new symbolTable.SymbolTable(),
                true
            );
            out.close();
        }
    }

    if(require.main === module){
        argv = optimist
            .usage(
                'Syntax analyzer for the Jack programming language.\n\n' +
                'Usage: jackanalyzer.js [file or dir] [--mode=(compile|tokenize|parse)|]')
            .default('mode', 'compile')
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

            switch(argv.mode){

                case 'tokenize':
                    tokenize(inputFileNames);
                    process.exit(0);
                    break;

                case 'parse':
                    compile(
                        inputFileNames,
                        new compilationenginev1.CompilationEngine(),
                        'parsed.xml'
                    );
                    process.exit(0);
                    break;

                case 'compile':
                    compile(
                        inputFileNames,
                        new compilationenginev2.CompilationEngine(),
                        'vm'
                    );
                    process.exit(0);
                    break;

                default:
                    console.log('Invalid mode specified.');
                    process.exit(1);
            }
        }
    }
}());
