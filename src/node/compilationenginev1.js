#!/usr/bin/env node

(function(){

    var jackTokenizer = require('./jacktokenizer'),

        CompilationEngine,
        TokenTypes = jackTokenizer.TokenTypes,

        IDENTIFIER = TokenTypes.IDENTIFIER,
        INT_CONST = TokenTypes.INT_CONST,
        SYMBOL = TokenTypes.SYMBOL,
        STRING_CONST = TokenTypes.STRING_CONST,
        KEYWORD = TokenTypes.KEYWORD;

    /**
     * First version of the CompilationEngine outputs an XML-formatted
     * syntax tree for .jack source code.
     */
    CompilationEngine = function(){
    };

    CompilationEngine.prototype.main = function(tokenizer, out, symbolTable, includeSymbolComments){
        this.tokenizer = tokenizer;
        this.out = out;
        this.currentTokenType = null;
        this.currentTokenValue = null;
        this.compileClass();
    };

    CompilationEngine.prototype.advance = function(){
        var methodName;

        if(this.tokenizer.hasNext()){
            this.tokenizer.next();
            this.currentTokenType = this.tokenizer.tokenType();
            methodName = this.tokenizer.methodMap[this.currentTokenType];
            this.currentTokenValue = this.tokenizer[methodName]();

        } else {
            this.currentTokenType = this.currentTokenValue = null;
        }
    };

    CompilationEngine.prototype.typeMatch = function(){
        var i;
        for(i=0; i<arguments.length; i+=1){
            if(this.currentTokenType === arguments[i]){
                return true;
            }
        }
        return false;
    };

    CompilationEngine.prototype.assertTypeMatch = function(){
        if(!this.typeMatch.apply(this, arguments)){
            throw new Error('Unexpected token type. Found "' +
                    this.currentTokenType + '", expected one of "' +
                    this.printArgs(arguments) + '"');
        }
    };

    CompilationEngine.prototype.expectTypeMatch = function(){
        this.advance();
        this.assertTypeMatch.apply(this, arguments);
    };

    CompilationEngine.prototype.valueMatch = function(){
        var i;
        for(i=0; i<arguments.length; i+=1){
            if(this.currentTokenValue === arguments[i]){
                return true;
            }
        }
        return false;
    };

    CompilationEngine.prototype.assertValueMatch = function(){
        if(!this.valueMatch.apply(this, arguments)){
            throw new Error(
                'Unexpected token value. Found "' + this.currentTokenValue +
                '", expected one of "' + this.printArgs(arguments) + '"');
        }
    };

    CompilationEngine.prototype.expectValueMatch = function(){
        this.advance();
        this.assertValueMatch.apply(this, arguments);
    };

    CompilationEngine.prototype.tokenMatch = function(){
        var i;
        for(i=0; i<arguments.length; i+=1){
            if( (this.currentTokenType === arguments[i][0]) &&
                    (this.currentTokenValue === arguments[i][1]) ){
                return true;
            }
        }
        return false;
    };

    CompilationEngine.prototype.assertTokenMatch = function(){
        if(!this.tokenMatch.apply(this, arguments)){
            throw new Error('Unexpected token. Found "' +
                    [this.currentTokenType, this.currentTokenValue].toString() +
                    '", expected one of "' + this.printArgs(arguments) + '"');
        }
    };

    CompilationEngine.prototype.expectTokenMatch = function(){
        this.advance();
        this.assertTokenMatch.apply(this, arguments);
    };

    CompilationEngine.prototype.printArgs = function(args){
        var i,
            out = '[';

        for(i=0; i<args.length; i+=1){
            out += args[i].toString();
            if(i<args.length -1){
                out += ', ';
            }
        }
        out += ']';
        return out;
    };

    CompilationEngine.prototype.compileClass = function(){

        this.expectTokenMatch([KEYWORD, 'class']);
        this.out.write('<class>');

        this.writeTag();

        this.expectTypeMatch(IDENTIFIER);
        this.writeTag();

        this.expectTokenMatch([SYMBOL, '{']);
        this.writeTag();

        this.advance();
        while(this.currentTokenType === KEYWORD){

            switch(this.currentTokenValue){

                case 'static':
                case 'field':
                    this.compileClassVarDec();
                    break;

                case 'constructor':
                case 'function':
                case 'method':
                    this.compileSubroutine();
                    break;

                default:
                    throw new Error(
                        'Unexpected keyword: "' + this.currentTokenValue + '"');
            }
        }

        this.assertTokenMatch([SYMBOL, '}']);
        this.writeTag();

        this.out.write('</class>');
    };

    CompilationEngine.prototype.compileClassVarDec = function(){
        this.out.write('<classVarDec>');

        this.writeTag();

        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        if(this.currentTokenType === KEYWORD){
            this.assertValueMatch('int', 'char', 'boolean');
        }
        this.writeTag();

        this.expectTypeMatch(IDENTIFIER);
        this.writeTag();

        this.advance();

        if(this.tokenMatch([SYMBOL, ','])){

            while(!this.tokenMatch([SYMBOL, ';'])){

                this.assertTokenMatch([SYMBOL, ',']);
                this.writeTag();

                this.expectTypeMatch(IDENTIFIER);
                this.writeTag();

                this.advance();
            }
        }

        // Expect to write (SYMBOL, ';');
        this.writeTag();

        this.out.write('</classVarDec>');
        this.advance();
    };

    CompilationEngine.prototype.compileSubroutine = function(){
        this.out.write('<subroutineDec>');

        this.writeTag();

        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        this.writeTag();

        this.expectTypeMatch(IDENTIFIER);
        this.writeTag();

        this.expectTokenMatch([SYMBOL, '(']);
        this.writeTag();

        this.compileParameterList();

        this.assertTokenMatch([SYMBOL, ')']);
        this.writeTag();

        this.out.write('<subroutineBody>');

        this.expectTokenMatch([SYMBOL, '{']);
        this.writeTag();

        this.advance();

        if(this.tokenMatch([KEYWORD, 'var'])){
            // Variable declarations

            while(this.tokenMatch([KEYWORD, 'var'])){
                this.compileVarDec();
            }
        }

        if(this.typeMatch(KEYWORD) && this.valueMatch('let', 'if', 'while', 'do', 'return')){

            this.compileStatements();
        }

        this.assertTokenMatch([SYMBOL, '}']);
        this.writeTag();

        this.out.write('</subroutineBody>');

        this.advance();

        this.out.write('</subroutineDec>');
    };

    CompilationEngine.prototype.compileParameterList = function(){
        this.advance();

        this.out.write('<parameterList>');

        while( !this.tokenMatch([SYMBOL, ')']) ){

            this.assertTypeMatch(KEYWORD, IDENTIFIER);
            this.writeTag();

            this.expectTypeMatch(IDENTIFIER);
            this.writeTag();

            this.expectTypeMatch(IDENTIFIER, KEYWORD, SYMBOL);

            if(this.tokenMatch([SYMBOL, ','])){
                this.writeTag();
                this.advance();
            }
        }

        this.out.write('</parameterList>');
    };

    CompilationEngine.prototype.compileVarDec = function(){
        this.out.write('<varDec>');
        this.writeTag();

        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        this.writeTag();

        this.expectTypeMatch(IDENTIFIER);
        this.writeTag();

        this.advance();
        if(this.tokenMatch([SYMBOL, ','])){
            while(this.tokenMatch([SYMBOL, ','])){
                this.writeTag();
                this.expectTypeMatch(IDENTIFIER);
                this.writeTag();
                this.advance();
            }
        }

        this.assertTokenMatch([SYMBOL, ';']);
        this.writeTag();

        this.advance();
        this.out.write('</varDec>');
    };

    CompilationEngine.prototype.compileStatements = function(){
        var methodName;

        this.out.write('<statements>');

        while(this.typeMatch(KEYWORD) &&
                this.valueMatch('let', 'if', 'while', 'do', 'return')){

            methodName = 'compile' +
                this.currentTokenValue.charAt(0).toUpperCase() +
                this.currentTokenValue.substr(1);

            this[methodName]();
        }

        this.out.write('</statements>');
    };

    CompilationEngine.prototype.compileDo = function(){
        this.out.write('<doStatement>');

        this.writeTag();
        this.expectTypeMatch(IDENTIFIER);

        this.compileSubroutineCall();

        this.assertTokenMatch([SYMBOL, ';']);
        this.writeTag();

        this.advance();

        this.out.write('</doStatement>');
    };


    CompilationEngine.prototype.compileSubroutineCall = function(){
        this.assertTypeMatch(IDENTIFIER);
        this.writeTag();

        this.expectTypeMatch(SYMBOL);

        if(this.valueMatch('.')){
            this.writeTag();

            this.expectTypeMatch(IDENTIFIER);
            this.writeTag();

            this.expectTokenMatch([SYMBOL, '(']);
            this.writeTag();

        } else if (this.valueMatch('(')) {
            this.writeTag();

        } else {
            throw new Error('Invalid subroutine call');
        }

        this.advance();
        this.compileExpressionList();

        this.assertTokenMatch([SYMBOL, ')']);
        this.writeTag();

        this.advance();
    };

    CompilationEngine.prototype.compileLet = function(){
        this.out.write('<letStatement>');
        this.writeTag();

        this.expectTypeMatch(IDENTIFIER);
        this.writeTag();

        this.advance();

        // Array access
        if(this.tokenMatch([SYMBOL, '['])){
            this.writeTag();
            this.advance();

            this.compileExpression();

            this.assertTokenMatch([SYMBOL, ']']);
            this.writeTag();
            this.advance();
        }

        this.assertTokenMatch([SYMBOL, '=']);
        this.writeTag();

        this.advance();
        this.compileExpression();

        this.assertTokenMatch([SYMBOL, ';']);
        this.writeTag();

        this.advance();

        this.out.write('</letStatement>');
    };

    CompilationEngine.prototype.compileWhile = function(){
        this.out.write('<whileStatement>');
        this.writeTag();

        this.expectTokenMatch([SYMBOL, '(']);
        this.writeTag();

        this.advance();
        this.compileExpression();

        this.assertTokenMatch([SYMBOL, ')']);
        this.writeTag();

        this.expectTokenMatch([SYMBOL, '{']);
        this.writeTag();

        this.advance();
        this.compileStatements();

        this.assertTokenMatch([SYMBOL, '}']);
        this.writeTag();

        this.advance();

        this.out.write('</whileStatement>');
    };

    CompilationEngine.prototype.compileReturn = function(){
        this.out.write('<returnStatement>');

        this.writeTag();

        this.advance();

        if(this.tokenMatch([SYMBOL, ';'])){
            this.writeTag();
            this.advance();

        } else {
            this.compileExpression();
            this.assertTokenMatch([SYMBOL, ';']);
            this.writeTag();
            this.advance();
        }

        this.out.write('</returnStatement>');
    };

    CompilationEngine.prototype.compileIf = function(){
        this.out.write('<ifStatement>');
        this.writeTag();

        this.expectTokenMatch([SYMBOL, '(']);
        this.writeTag();

        this.advance();
        this.compileExpression();

        this.assertTokenMatch([SYMBOL, ')']);
        this.writeTag();

        this.expectTokenMatch([SYMBOL, '{']);
        this.writeTag();

        this.advance();
        this.compileStatements();

        this.assertTokenMatch([SYMBOL, '}']);
        this.writeTag();

        this.advance();
        if(this.tokenMatch([KEYWORD, 'else'])){
            this.writeTag();

            this.expectTokenMatch([SYMBOL, '{']);
            this.writeTag();

            this.compileStatements();

            this.assertTokenMatch([SYMBOL, '}']);
            this.writeTag();

            this.advance();
        }

        this.out.write('</ifStatement>');
    };

    CompilationEngine.prototype.compileExpression = function(){
        this.out.write('<expression>');

        while(true){
            this.compileTerm();


            if(this.typeMatch(SYMBOL) && this.valueMatch(
                    '+', '-', '*', '/', '&', '|', '<', '>', '=')){

                this.writeTag();
                this.advance();

            } else {
                break;
            }
        }

        this.out.write('</expression>');
    };

    CompilationEngine.prototype.compileTerm = function(){
        var lookAheadMatch, lookAheadType, lookAheadValue, termType;

        this.out.write('<term>');

        if(this.typeMatch(STRING_CONST, INT_CONST) || (this.typeMatch(KEYWORD) &&
                this.valueMatch('true', 'false', 'null', 'this'))){

            this.writeTag();
            this.advance();

        } else if(this.typeMatch(IDENTIFIER)){

            termType = 'variable';

            if(this.tokenizer.hasNext()){
                lookAheadMatch = this.tokenizer.next({peek:true});
                lookAheadType = lookAheadMatch[0];
                lookAheadValue = lookAheadMatch[1];

                if(lookAheadType === SYMBOL){
                    if(lookAheadValue === '['){
                        termType = 'arrayEntry';

                    } else if((lookAheadValue === '(') || (lookAheadValue === '.')){
                        termType = 'subroutineCall';
                    }
                }
            }

            switch(termType){

                case 'variable':
                    this.writeTag();
                    this.advance();
                    break;

                case 'arrayEntry':
                    this.writeTag();

                    this.expectTokenMatch([SYMBOL, '[']);
                    this.writeTag();
                    this.advance();

                    this.compileExpression();

                    this.assertTokenMatch([SYMBOL, ']']);
                    this.writeTag();

                    this.advance();
                    break;

                case 'subroutineCall':
                    this.compileSubroutineCall();
                    break;
            }

        } else if(this.tokenMatch([SYMBOL, '('])){

            this.writeTag();
            this.advance();

            this.compileExpression();

            this.assertTokenMatch([SYMBOL, ')']);
            this.writeTag();
            this.advance();

        } else if(this.typeMatch(SYMBOL) && this.valueMatch('-', '~')){

            this.writeTag();
            this.advance();
            this.compileTerm();

        } else {
            throw new Error('Invalid term. ' + this.currentTokenType + ' ' + this.currentTokenValue);
        }

        this.out.write('</term>');
    };

    CompilationEngine.prototype.compileExpressionList = function(){
        this.out.write('<expressionList>');

        while(!this.tokenMatch([SYMBOL, ')'])){
            this.compileExpression();

            if(this.tokenMatch([SYMBOL, ','])){
                this.writeTag();
                this.advance();
            }
        }

        this.out.write('</expressionList>');
    };

    CompilationEngine.prototype.writeTag = function(tagName, value){
        if(tagName === undefined){
            tagName = this.currentTokenType;
        }

        if(value === undefined){
            value = this.currentTokenValue;
        }

        value = value.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        this.out.write('<' + tagName + '> ' + value + ' </' + tagName + '>');
    };

    exports.CompilationEngine = CompilationEngine;

}());
