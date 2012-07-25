#!/usr/bin/env node

(function(){

    var jackTokenizer = require('./jacktokenizer'),
        symboltable = require('./symboltable'),
        
        CompilationEngine,
        TokenTypes = jackTokenizer.TokenTypes,
        SymbolKinds = symboltable.SymbolKinds,
        
        IDENTIFIER = TokenTypes.IDENTIFIER,
        INT_CONST = TokenTypes.INT_CONST,
        SYMBOL = TokenTypes.SYMBOL,
        STRING_CONST = TokenTypes.STRING_CONST,
        KEYWORD = TokenTypes.KEYWORD;
    
    /**
     * Top-down parser for the Jack programming language.
     *
     */
    CompilationEngine = function(){
        this.constants = {
            'true': 'true',
            'false': 'false',
            'null': '0',
            'this': 'this'
        };
    };
    
    CompilationEngine.prototype.main = function(tokenizer, out, symbolTable, includeSymbolComments){
        var self = this;
        this.tokenizer = tokenizer;
        this.out = out;
        this.currentTokenType = null;
        this.currentTokenValue = null;
        this.symbolTable = symbolTable;
        this.currentClassName = null;
        this.includeSymbolComments = includeSymbolComments;
        
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
        var symbolObj;
        
        this.expectTokenMatch([KEYWORD, 'class']);
        
        this.expectTypeMatch(IDENTIFIER);
        this.currentClassName = this.currentTokenValue;
        this.define(this.currentTokenValue, 'class', SymbolKinds.STATIC);
        
        this.expectTokenMatch([SYMBOL, '{']);
        
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
    };
    
    CompilationEngine.prototype.compileClassVarDec = function(){
        var type, kind, name;
        
        if(this.valueMatch('static')){
            kind = SymbolKinds.STATIC;
            
        } else if(this.valueMatch('field')){
            kind = SymbolKinds.FIELD;
        }
        
        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        if(this.currentTokenType === KEYWORD){
            this.assertValueMatch('int', 'char', 'boolean');
        }
        type = this.currentTokenValue;
        
        this.expectTypeMatch(IDENTIFIER);
        name = this.currentClassName + '.' + this.currentTokenValue;
        this.define(name, type, kind);
        
        this.advance();
        
        if(this.tokenMatch([SYMBOL, ','])){
            
            while(!this.tokenMatch([SYMBOL, ';'])){
                
                this.assertTokenMatch([SYMBOL, ',']);
                
                this.expectTypeMatch(IDENTIFIER);
                name = this.currentClassName + '.' + this.currentTokenValue;
                this.define(name, type, kind);
                
                this.advance();
            }
        }
        this.advance();
    };
    
    CompilationEngine.prototype.compileSubroutine = function(){
        var type, subroutineName;
        
        numLocals = 0;
        
        type = this.currentTokenValue;
        
        this.symbolTable.startSubroutine();
        
        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        
        this.expectTypeMatch(IDENTIFIER);
        subroutineName = this.currentClassName + '.' + this.currentTokenValue;
        
        this.expectTokenMatch([SYMBOL, '(']);
        
        this.compileParameterList();
        
        this.assertTokenMatch([SYMBOL, ')']);
        
        this.define(subroutineName, type, SymbolKinds.STATIC);
        
        this.expectTokenMatch([SYMBOL, '{']);
        
        this.advance();
        
        if(this.tokenMatch([KEYWORD, 'var'])){
            // Variable declarations
            
            while(this.tokenMatch([KEYWORD, 'var'])){
                this.compileVarDec();
            }
        }
        
        this.write('function ' + subroutineName + ' ' + this.symbolTable.varCount(SymbolKinds.VAR));
        
        if(this.typeMatch(KEYWORD) && 
                this.valueMatch('let', 'if', 'while', 'do', 'return')){
            
            this.compileStatements();
        }
        
        this.assertTokenMatch([SYMBOL, '}']);
        this.advance();
    };
    
    CompilationEngine.prototype.compileParameterList = function(){
        var type, numArgs;
        
        numArgs = 0;
        
        this.advance();
        
        while( !this.tokenMatch([SYMBOL, ')']) ){
            
            this.assertTypeMatch(KEYWORD, IDENTIFIER);
            type = this.currentTokenValue;
            
            this.expectTypeMatch(IDENTIFIER);
            this.define(this.currentTokenValue, type, SymbolKinds.ARG);
            
            this.expectTypeMatch(IDENTIFIER, KEYWORD, SYMBOL);
            
            numArgs += 1;
            
            if(this.tokenMatch([SYMBOL, ','])){
                this.advance();
            }
        }
        return numArgs;
    };
    
    CompilationEngine.prototype.compileVarDec = function(){
        var type;
        
        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        type = this.currentTokenValue;
        
        this.expectTypeMatch(IDENTIFIER);
        this.define(this.currentTokenValue, type, SymbolKinds.VAR);
        
        this.advance();
        
        if(this.tokenMatch([SYMBOL, ','])){
            while(this.tokenMatch([SYMBOL, ','])){
                this.expectTypeMatch(IDENTIFIER);
                this.define(this.currentTokenValue, type, SymbolKinds.VAR);
                this.advance();
            }
        }
        
        this.assertTokenMatch([SYMBOL, ';']);
        this.advance();
    };
    
    CompilationEngine.prototype.compileStatements = function(){
        var methodName;
        
        while(this.typeMatch(KEYWORD) &&
                this.valueMatch('let', 'if', 'while', 'do', 'return')){
            
            methodName = 'compile'
                        + this.currentTokenValue.charAt(0).toUpperCase()
                        + this.currentTokenValue.substr(1);
            
            this[methodName]();
        }
    };
    
    CompilationEngine.prototype.compileDo = function(){
        this.expectTypeMatch(IDENTIFIER);
        this.compileSubroutineCall();
        this.assertTokenMatch([SYMBOL, ';']);
        this.advance();
    };
    
    
    CompilationEngine.prototype.compileSubroutineCall = function(){
        var subroutineName, numExpressions, i;
        
        this.assertTypeMatch(IDENTIFIER);
        subroutineName = this.currentTokenValue;
        
        this.expectTypeMatch(SYMBOL);
        
        if(this.valueMatch('.')){
            subroutineName += this.currentTokenValue;
            
            this.expectTypeMatch(IDENTIFIER);
            subroutineName += this.currentTokenValue;
            
            this.expectTokenMatch([SYMBOL, '(']);
            
        } else if (this.valueMatch('(')) {
            // Local function
            
        } else {
            throw new Error('Invalid subroutine call');
        }
        
        this.advance();
        numExpressions = this.compileExpressionList();
        
        this.assertTokenMatch([SYMBOL, ')']);
        this.usage(subroutineName);
        
        this.write('call ' + subroutineName + ' ' + numExpressions);
        
        this.advance();
    };
    
    CompilationEngine.prototype.compileLet = function(){
        var symbolName, symbolKind, symbolIndex;
        
        this.expectTypeMatch(IDENTIFIER);
        this.usage(this.currentTokenValue);
        
        symbolName = this.currentTokenValue;
        symbolKind = this.symbolTable.kindOf(symbolName);
        symbolIndex = this.symbolTable.indexOf(symbolName);
        
        this.advance();
        
        // Array access
        if(this.tokenMatch([SYMBOL, '['])){
            this.advance();
            
            this.compileExpression();
            
            this.assertTokenMatch([SYMBOL, ']']);
            this.advance();
        }
        
        this.assertTokenMatch([SYMBOL, '=']);
        
        this.advance();
        this.compileExpression();
        
        this.assertTokenMatch([SYMBOL, ';']);
        
        this.write('pop ' + symbolKind + ' ' + symbolIndex);
        
        this.advance();
    };
    
    CompilationEngine.prototype.compileWhile = function(){
        
        this.expectTokenMatch([SYMBOL, '(']);
        
        this.advance();
        this.compileExpression();
        
        this.assertTokenMatch([SYMBOL, ')']);
        
        this.expectTokenMatch([SYMBOL, '{']);
        
        this.advance();
        this.compileStatements();
        
        this.assertTokenMatch([SYMBOL, '}']);
        
        this.advance();
    };
    
    CompilationEngine.prototype.compileReturn = function(){
        this.advance();
        
        if(this.tokenMatch([SYMBOL, ';'])){
            
            // The function is terminating without returning a value. A return
            // value is always required, however, so we pop the top of the
            // stack to temp 0, which is ignored, and push a null on to the
            // stack which becomes the new return value.
            
            this.advance();
            this.write(
                'pop temp 0',
                'push constant 0'
            );
            
        } else {
            // If the return statement has an expression, evaluate it and
            // leave the result of its evaluation at the top of the stack,
            // which becomes the value returned from this function.
            
            this.compileExpression();
            this.assertTokenMatch([SYMBOL, ';']);
            this.advance();
        }
        this.write('return');
    };
    
    CompilationEngine.prototype.compileIf = function(){
        this.expectTokenMatch([SYMBOL, '(']);
        
        this.advance();
        this.compileExpression();
        
        this.assertTokenMatch([SYMBOL, ')']);
        
        this.expectTokenMatch([SYMBOL, '{']);
        
        this.advance();
        this.compileStatements();
        
        this.assertTokenMatch([SYMBOL, '}']);
        
        this.advance();
        if(this.tokenMatch([KEYWORD, 'else'])){
            this.expectTokenMatch([SYMBOL, '{']);
            
            this.advance();
            this.compileStatements();
            
            this.assertTokenMatch([SYMBOL, '}']);
            
            this.advance();
        }
    };
    
    CompilationEngine.prototype.compileExpression = function(){
        var operatorMap, operator;
        
        operatorMap = {
            '+': 'add',
            '-': 'sub',
            '*': 'call Math.multiply 2',
            '/': '',
            '&': '',
            '|': '',
            '<': 'lt',
            '>': 'gt',
            '=': ''
        }
        
        this.compileTerm();
        
        if(this.typeMatch(SYMBOL) && this.valueMatch('+', '-', '*', '/', '&', '|', '<', '>', '=')){
            operator = operatorMap[this.currentTokenValue];
            this.advance();
            this.compileTerm();
            this.write(operator);
        }
    };
    
    CompilationEngine.prototype.compileTerm = function(){
        var lookAheadMatch, lookAheadType, lookAheadValue, termType, i,
            symbolName, symbolKind, symbolIndex;
        
        if(this.typeMatch(STRING_CONST)){
            this.write(
                'push constant ' + this.currentTokenValue.length,
                'call String.new 1'
            );
            for(i=0; i<this.currentTokenValue.length; i++){
                this.write(
                    'push constant ' + this.currentTokenValue.charCodeAt(i),
                    'call String.appendChar 2'
                );
            }
            this.advance();
            
        } else if(this.typeMatch(INT_CONST)){
            
            this.write('push constant ' + this.currentTokenValue);
            this.advance();
            
        } else if((this.typeMatch(KEYWORD) && this.valueMatch('true', 'false', 'null', 'this'))){
                    
            this.write('push constant ' + this.constants[this.currentTokenValue]);
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
                    symbolName = this.currentTokenValue;
                    symbolKind = this.symbolTable.kindOf(symbolName);
                    symbolIndex = this.symbolTable.indexOf(symbolName);
                    this.usage(this.currentTokenValue);
                    this.write('push ' + symbolKind + ' ' + symbolIndex);
                    this.advance();
                    break;
                    
                case 'arrayEntry':
                    this.expectTokenMatch([SYMBOL, '[']);
                    this.advance();
                    
                    this.compileExpression();
                    
                    this.assertTokenMatch([SYMBOL, ']']);
                    
                    this.advance();
                    break;
                    
                case 'subroutineCall':
                    this.compileSubroutineCall();
                    break;
            }
            
        } else if(this.tokenMatch([SYMBOL, '('])){
            this.advance();
            
            this.compileExpression();
            
            this.assertTokenMatch([SYMBOL, ')']);
            this.advance();
            
        } else if(this.typeMatch(SYMBOL) && this.valueMatch('-', '~')){
            this.advance();
            this.compileTerm();
        
        } else {
            throw new Error('Invalid term. ' + this.currentTokenType + ' ' + this.currentTokenValue);
        }
    };
    
    CompilationEngine.prototype.compileExpressionList = function(){
        var numExpressions = 0;
        while(!this.tokenMatch([SYMBOL, ')'])){
            this.compileExpression();
            numExpressions +=1;
            if(this.tokenMatch([SYMBOL, ','])){
                this.advance();
            }
        }
        return numExpressions;
    };
    
    CompilationEngine.prototype.writeComment = function(value){
        if(this.includeSymbolComments){
            // this.write('// ' + value);
        }
    };
    
    CompilationEngine.prototype.define = function(name, type, kind){
        var symbolObj = this.symbolTable.define(name, type, kind);
        this.writeComment('[DEFINE] Name: "' + name + '", ' + this.printSymbolObj(symbolObj));
    };
    
    CompilationEngine.prototype.usage = function(name){
        this.writeComment('[USAGE] Name: "' + name + '"');
    };
    
    CompilationEngine.prototype.printSymbolObj = function(symbolObj){
        var str = '{', k;
        for(k in symbolObj){
            if(symbolObj.hasOwnProperty(k)){
                str += k + ': ' + symbolObj[k] + ', ';
            }
        }
        str+='}';
        return str;
    };
    
    CompilationEngine.prototype.write = function(){
        var i;
        for(i=0; i<arguments.length; i++){
            this.out.write(arguments[i]);
        }
    };
    
    exports.CompilationEngine = CompilationEngine;
    
}());