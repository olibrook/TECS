#!/usr/bin/env node

(function(){

    var jackTokenizer = require('./jacktokenizer'),
        optimist = require('optimist'),
        fs = require('fs'),
        path = require('path'),
        glob = require('glob'),
        
        CompilationEngine,
        TokenTypes = jackTokenizer.TokenTypes,
        
        IDENTIFIER = TokenTypes.IDENTIFIER,
        INT_CONST = TokenTypes.INT_CONST,
        WHITESPACE = TokenTypes.WHITESPACE,
        SYMBOL = TokenTypes.SYMBOL,
        STRING_CONST = TokenTypes.STRING_CONST,
        SINGLE_LINE_COMMENT = TokenTypes.SINGLE_LINE_COMMENT,
        MULTI_LINE_COMMENT = TokenTypes.MULTI_LINE_COMMENT,
        KEYWORD = TokenTypes.KEYWORD;
    
    CompilationEngine = function(){
        // Maps token types to methods used to get the token value from the
        // tokenizer.
        this.tokenizerMethodMap = {};
        this.tokenizerMethodMap[KEYWORD] = 'keyWord';
        this.tokenizerMethodMap[SYMBOL] = 'symbol';
        this.tokenizerMethodMap[IDENTIFIER] = 'identifier';
        this.tokenizerMethodMap[INT_CONST] = 'intVal';
        this.tokenizerMethodMap[STRING_CONST] = 'stringVal';
    };
    
    CompilationEngine.prototype.main = function(tokenizer){
        this.tokenizer = tokenizer;
        this.currentTokenType = null;
        this.currentTokenValue = null;
        this.compileClass();
    };
    
    CompilationEngine.prototype.advance = function(){
        var methodName;
        
        if(this.tokenizer.hasNext()){
            this.tokenizer.next();
            this.currentTokenType = this.tokenizer.tokenType();
            methodName = this.tokenizerMethodMap[this.currentTokenType];
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
            throw new Error('Unexpected token type. Found "'
                    + this.currentTokenType + '", expected one of "'
                    + this.printArgs(arguments) + '"');
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
            throw new Error('Unexpected token value. Found "'
                    + this.currentTokenValue + '", expected one of "'
                    + this.printArgs(arguments) + '"');
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
            throw new Error('Unexpected token. Found "' 
                    + [this.currentTokenType, this.currentTokenValue].toString()
                    + '", expected one of "' + this.printArgs(arguments) + '"');
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
        console.log('<class>');
        
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
                    throw new Error('Unexpected keyword: "' 
                            + this.currentTokenValue + '"');
            }
        }
        
        this.assertTokenMatch([SYMBOL, '}']);
        this.writeTag();
        
        console.log('</class>');
    };
    
    CompilationEngine.prototype.compileClassVarDec = function(){
        console.log('<classVarDec>');
        
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
        
        console.log('</classVarDec>');
        this.advance();
    };
    
    CompilationEngine.prototype.compileSubroutine = function(){
        console.log('<subroutineDec>');
        
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
        
        console.log('<subroutineBody>');
        
        this.expectTokenMatch([SYMBOL, '{']);
        this.writeTag();
        
        this.advance();
        
        if(this.tokenMatch([KEYWORD, 'var'])){
            // Variable declarations
            
            while(this.tokenMatch([KEYWORD, 'var'])){
                this.compileVarDec();
            }
        }
        
        if(this.typeMatch(KEYWORD) && 
                this.valueMatch('let', 'if', 'while', 'do', 'return')){
            
            this.compileStatements();
        }
        
        this.assertTokenMatch([SYMBOL, '}']);
        this.writeTag();
        
        console.log('</subroutineBody>');
        
        this.advance();
        
        console.log('</subroutineDec>');
    };
    
    CompilationEngine.prototype.compileParameterList = function(){
        this.advance();
        
        console.log('<parameterList>');
        
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
        
        console.log('</parameterList>');
    };
    
    CompilationEngine.prototype.compileVarDec = function(){
        console.log('<varDec>');
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
        console.log('</varDec>');
    };
    
    CompilationEngine.prototype.compileStatements = function(){
        var methodName;
        
        console.log('<statements>');
        
        while(this.typeMatch(KEYWORD) &&
                this.valueMatch('let', 'if', 'while', 'do', 'return')){
            
            methodName = 'compile'
                        + this.currentTokenValue.charAt(0).toUpperCase()
                        + this.currentTokenValue.substr(1);
            
            this[methodName]();
        }
        
        console.log('</statements>');
    };
    
    CompilationEngine.prototype.compileDo = function(){
        console.log('<doStatement>');
        
        this.writeTag();
        this.expectTypeMatch(IDENTIFIER);
        
        this.compileSubroutineCall();
        
        this.assertTokenMatch([SYMBOL, ';']);
        this.writeTag();
        
        this.advance();
        
        console.log('</doStatement>');
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
    }
    
    CompilationEngine.prototype.compileLet = function(){
        console.log('<letStatement>');
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
        
        console.log('</letStatement>');
    };
    
    CompilationEngine.prototype.compileWhile = function(){
        console.log('<whileStatement>');
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
        
        console.log('</whileStatement>');
    };
    
    CompilationEngine.prototype.compileReturn = function(){
        console.log('<returnStatement>');
        
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
        
        console.log('</returnStatement>');
    };
    
    CompilationEngine.prototype.compileIf = function(){
        console.log('<ifStatement>');
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
        
        console.log('</ifStatement>');
    };
    
    CompilationEngine.prototype.compileExpression = function(){
        console.log('<expression>');
        
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
        
        console.log('</expression>');
    };
    
    CompilationEngine.prototype.compileTerm = function(){
        var lookAheadMatch, lookAheadType, lookAheadValue, termType;
        
        console.log('<term>');
        
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
        
        console.log('</term>');
    };
    
    CompilationEngine.prototype.compileExpressionList = function(){
        console.log('<expressionList>');
        
        while(!this.tokenMatch([SYMBOL, ')'])){
            this.compileExpression();
            
            if(this.tokenMatch([SYMBOL, ','])){
                this.writeTag();
                this.advance();
            }
        }
        
        console.log('</expressionList>');
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
        
        console.log('<' + tagName + '> ' + value + ' </' + tagName + '>');
    };
    
    exports.CompilationEngine = CompilationEngine;
    
    
    (function(){
        var source,
            tokenizer,
            compilationEngine;
    
            source = fs.readFileSync(process.argv[2], 'ascii');
            tokenizer = new jackTokenizer.Tokenizer(source);
            compilationEngine = new CompilationEngine();
            compilationEngine.main(tokenizer);
    }());
    
}());