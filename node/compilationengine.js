#!/usr/bin/env node

(function(){
    
    var CompilationEngine;
    
    CompilationEngine = function(){
    };
    
    CompilationEngine.prototype.main = function(tokenizer){
        this.tokenizer = tokenizer;
        this.currentTokenType = null;
        this.currentTokenValue = null;
        this.compileClass();
    };
    
    CompilationEngine.prototype.advance = function(){
        if(this.tokenizer.hasNext()){
            this.currentTokenType = this.tokenizer.tokenType();
            
            switch(this.currentTokenType){

                case 'KEYWORD':
                    this.currentTokenValue = this.tokenizer.keyWord();
                    break;

                case 'SYMBOL':
                    this.currentTokenValue = this.tokenizer.symbol();
                    break;

                case 'IDENTIFIER':
                    this.currentTokenValue = this.tokenizer.identifier();
                    break;

                case 'INT_CONST':
                    this.currentTokenValue = this.tokenizer.intVal();
                    break;

                case 'STRING_CONST':
                    this.currentTokenValue = this.tokenizer.stringVal();
                    break;
                
                default:
                    throw new Error('Unexpected token type.');
                    break;
            }
            
        } else {
            this.currentTokenType = this.currentTokenValue = null;
        }
    };
    
    CompilationEngine.prototype.expectTokenType = function(tokenType){
        var i, match;
        
        match = false;
        
        this.advance();
        
        if(typeof(tokenType) === 'string'){
            tokenType = [tokenType];
        }
        
        for(var i = 0; i<tokenType.length; i++){
            if(this.currentTokenType === tokenType[i]){
                match = true;
                break;
            }
        }
        
        if(!match){
            throw new Error('Unexpected token type "' + this.currentTokenType +'"');
        }
    };
    
    CompilationEngine.prototype.expect = function(tokenType, tokenValue){
        this.advance();
        if(! ((this.currentTokenType === tokenType) && (this.currentTokenValue === tokenValue)) ){
            throw new Error('Unexpected token "' + this.currentTokenValue +'"');
        }
    };
    
    CompilationEngine.prototype.assertCurrent = function(tokenType, tokenValue){
        var i, typeMatch, valueMatch;
        
        typeMatch = valueMatch = false;
        
        if(tokenType !== undefined){
            if(typeof(tokenType) === 'string'){
                tokenType = [tokenType];
            }
            
            for(i=0; i<tokenType.length; i++){
                if(this.currentTokenType === tokenType[i]){
                    typeMatch = true;
                    break;
                }
            }
            
            if(!typeMatch){
                throw new Error('Expected "' + tokenType + '", found "' + this.currentTokenType + '"');
            }
        }
        
        if(tokenValue !== undefined){
            if(typeof(tokenValue) === 'string'){
                tokenValue = [tokenValue];
            }
            
            for(i=0; i<tokenValue.length; i++){
                if(this.currentTokenValue === tokenValue[i]){
                    valueMatch = true;
                }
            }
            
            if(!valueMatch){
                throw new Error('Expected "' + tokenValue + '", found "' + this.currentTokenValue + '"');
            }
        }
    };
    
    CompilationEngine.prototype.compileClass = function(){

        this.expect('KEYWORD', 'class');
        console.log('<class>');
        
        this.writeTag();
        
        this.expectTokenType('IDENTIFIER');
        this.writeTag();
        
        this.expect('SYMBOL', '{');
        this.writeTag();
        
        this.advance();
        while(this.currentTokenType === 'KEYWORD'){
            
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
                    throw new Error('Unexpected keyword: "' + this.currentTokenValue + '"');
            }
            
            this.advance();
        }
        
        this.expect('SYMBOL', '}');
        this.writeTag();
        
        console.log('</class>');
    };
    
    CompilationEngine.prototype.compileClassVarDec = function(){
        console.log('<classVarDec>');
        console.log('</classVarDec>');
    };
    
    CompilationEngine.prototype.compileSubroutine = function(){
        console.log('<subroutineDec>');
        
        this.writeTag();
        
        this.expectTokenType(['KEYWORD', 'IDENTIFIER']);
        
        switch(this.currentTokenType){
            case 'KEYWORD':
                this.writeTag();
                break;
                
            case 'IDENTIFIER':
                this.writeTag();
                break;
        }
        
        this.expectTokenType('IDENTIFIER');
        this.writeTag();
        
        this.expect('SYMBOL', '(');
        this.writeTag();
        
        this.compileParameterList();
        
        this.assertCurrent('SYMBOL', ')');
        this.writeTag();
        
        this.expect('SYMBOL', '{');
        this.writeTag();
        
        
        this.expect('SYMBOL', '}');
        this.writeTag();
        
        console.log('</subroutineDec>');
    };
    
    CompilationEngine.prototype.compileParameterList = function(){
        this.advance();
        
        while( !((this.currentTokenType == 'SYMBOL') && (this.currentTokenValue == ')')) ){
            
            this.assertCurrent(['KEYWORD', 'IDENTIFIER']);
            this.writeTag()
            
            this.advance();
            
            if((this.currentTokenType === 'SYMBOL') && (this.currentTokenValue === ',')){
                this.writeTag();
                this.expectTokenType('IDENTIFIER');
            }
        }
    };
    
    CompilationEngine.prototype.compileVarDec = function(){
        
    };
    
    CompilationEngine.prototype.compileStatements = function(){
        
    };
    
    CompilationEngine.prototype.compileDo = function(){
        
    };
    
    CompilationEngine.prototype.compileLet = function(){
        
    };
    
    CompilationEngine.prototype.compileWhile = function(){
        
    };
    
    CompilationEngine.prototype.compileReturn = function(){
        
    };
    
    CompilationEngine.prototype.compileIf = function(){
        
    };
    
    CompilationEngine.prototype.compileExpression = function(){
        
    };
    
    CompilationEngine.prototype.compileTerm = function(){
        
    };
    
    CompilationEngine.prototype.compileExpressionList = function(){
        
    };

    CompilationEngine.prototype.writeTag = function(tagName, value){
        if(tagName === undefined){
            tagName = this.currentTokenType.toLowerCase();
        }
        
        if(value === undefined){
            value = this.currentTokenValue;
        }
        console.log('<' + tagName + '> ' + value + ' </' + tagName + '>');
    };
    
    exports.CompilationEngine = CompilationEngine;
    
    
    (function(){
        var optimist = require('optimist'),
            fs = require('fs'),
            path = require('path'),
            jackTokenizer = require('./jacktokenizer'),
            glob = require('glob'),
        
            source,
            tokenizer,
            compilationEngine;

            source = fs.readFileSync(process.argv[2], 'ascii');
            tokenizer = new jackTokenizer.Tokenizer(source);
            compilationEngine = new CompilationEngine();
            compilationEngine.main(tokenizer);

    }());
}());