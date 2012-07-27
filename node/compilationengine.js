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
        
        // Maps symbol kinds to the corresponding segment at the VM level.
        this.kindMap = {
            'var': 'local',
            'arg': 'argument'
        };
        
        // Maps operators to the corresponding VM/OS operations.
        this.operatorMap = {
            '+': 'add',
            '-': 'sub',
            '*': 'call Math.multiply 2',
            '/': 'call Math.divide 2',
            '&': 'and',
            '|': '',
            '<': 'lt',
            '>': 'gt',
            '=': 'eq'
        };
        
        // Maps unary operators to corresponding VM operations (note that
        // '-' exists as a unary and a binary operation).
        this.unaryOperatorMap = {
            '-': 'neg',
            '~': 'not',
        };
        
        // Maps constants to the VM code used to push the constant onto the
        // stack.
        this.constants = {
            'true': ['push constant 0', 'not'],
            'false': ['push constant 0'],
            'null': ['push constant 0'],
            'this': ['push constant this']
        };
        
        // Counters used to generate unique labels in the VM code for looping
        // constructs.
        this.whileStatementCount = 0;
        this.ifStatementCount = 0;
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
        this.ifStatementCount = 0;
        this.whileStatementCount = 0;
        
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
    
    /*
     * Compiles a do-statement, which is a subroutine call without an
     * assignment. The return value of the subroutine call must be popped off
     * the stack and ignored.
     */
    CompilationEngine.prototype.compileDo = function(){
        this.expectTypeMatch(IDENTIFIER);
        this.compileSubroutineCall();
        this.write('pop temp 0');
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
        var symbolName, symbolKind, symbolIndex, isPointerAssignment;
        
        isPointerAssignment = false;
        
        this.expectTypeMatch(IDENTIFIER);
        this.usage(this.currentTokenValue);
        
        symbolName = this.currentTokenValue;
        symbolKind = this.symbolTable.kindOf(symbolName);
        symbolIndex = this.symbolTable.indexOf(symbolName);
        
        this.advance();
        
        if(this.tokenMatch([SYMBOL, '['])){
            
            // For an Array assignment we have the current symbol which is a
            // pointer to the Array, plus an offset, which is the result of
            // evaluating the expression between the square brackets, eg.
            // a[1+1].
            
            // In the VM code we need to evaluate the offset expression...
            this.advance();
            this.compileExpression();
            this.assertTokenMatch([SYMBOL, ']']);
            this.advance();
            
            // ... and then add that to the base address of the Array.
            this.write('push ' + this.getSegment(symbolKind) + ' ' + symbolIndex);
            this.write('add');
            
            // This will be used later on to conditionally treat the Assigment
            // as an assignement to a pointer, or an assignment to a local
            // variable of some kind.
            isPointerAssignment = true;
        }
        
        this.assertTokenMatch([SYMBOL, '=']);
        this.advance();
        this.compileExpression();
        this.assertTokenMatch([SYMBOL, ';']);
        
        if(isPointerAssignment){
            
            // The topmost element on the stack is the value of the assignemnt
            // and the element directly beneath is a pointer to the location
            // in memory where the value should be saved.
            
            this.write(
                'pop temp 0',       // Pop the value to temp
                'pop pointer 1',    // Pop the pointer
                'push temp 0',      // Push the value back
                'pop that 0'        // Pop the value using the pointer
            );
            
        } else {
            
            // This is an assignment to one of the local or static segments,
            // and we can simply pop the value off the stack.
            
            this.write('pop ' + this.getSegment(symbolKind) + ' ' + symbolIndex);
        }
        
        this.advance();
    };
    
    CompilationEngine.prototype.compileWhile = function(){
        var currentWhileCount = this.whileStatementCount;
        this.whileStatementCount += 1;
        
        this.write('label WHILE_EXP' + currentWhileCount);
        
        this.expectTokenMatch([SYMBOL, '(']);
        
        this.advance();
        this.compileExpression();
        
        this.assertTokenMatch([SYMBOL, ')']);
        
        this.write(
            'not',
            'if-goto WHILE_END' + currentWhileCount
        )
        
        this.expectTokenMatch([SYMBOL, '{']);
        
        this.advance();
        this.compileStatements();
        
        this.assertTokenMatch([SYMBOL, '}']);
        
        this.write(
            'goto WHILE_EXP' + currentWhileCount,
            'label WHILE_END' + currentWhileCount
        )
        
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
        
        // Need to cache the if statement count so that unique labels can
        // be generated correctly for nested if statements.
        
        var cachedCount = this.ifStatementCount;
        this.ifStatementCount += 1;
        
        this.expectTokenMatch([SYMBOL, '(']);
        
        this.advance();
        this.compileExpression();
        this.write('if-goto IF_TRUE' + cachedCount);
        this.write('goto IF_FALSE' + cachedCount);
        
        this.assertTokenMatch([SYMBOL, ')']);
        this.expectTokenMatch([SYMBOL, '{']);
        
        this.write('label IF_TRUE' + cachedCount);
        
        this.advance();
        this.compileStatements();
        
        this.write('goto IF_END' + cachedCount);
        
        this.write('label IF_FALSE' + cachedCount);
        
        this.assertTokenMatch([SYMBOL, '}']);
        this.advance();
        
        if(this.tokenMatch([KEYWORD, 'else'])){
            this.expectTokenMatch([SYMBOL, '{']);
            
            this.advance();
            this.compileStatements();
            
            this.assertTokenMatch([SYMBOL, '}']);
            
            this.advance();
        }
        
        this.write('label IF_END' + cachedCount);
    };
    
    CompilationEngine.prototype.compileExpression = function(){
        var operator;
        
        this.compileTerm();
        
        if(this.typeMatch(SYMBOL) && this.valueMatch('+', '-', '*', '/', '&', '|', '<', '>', '=')){
            operator = this.operatorMap[this.currentTokenValue];
            this.advance();
            this.compileTerm();
            this.write(operator);
        }
    };
    
    CompilationEngine.prototype.compileTerm = function(){
        var lookAheadMatch, lookAheadType, lookAheadValue, termType, i,
            symbolName, symbolKind, symbolIndex, constants, kindMap, operator;
        
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

            this.write.apply(this, this.constants[this.currentTokenValue]);
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
                    
                    if(symbolKind === undefined){
                        throw new Error();
                    }
                    
                    this.usage(this.currentTokenValue);
                    this.write('push ' + this.getSegment(symbolKind) + ' ' + symbolIndex);
                    this.advance();
                    break;
                    
                case 'arrayEntry':
                    symbolName = this.currentTokenValue;
                    symbolKind = this.symbolTable.kindOf(symbolName);
                    symbolIndex = this.symbolTable.indexOf(symbolName);
                    
                    this.write('push ' + this.getSegment(symbolKind) + ' ' + symbolIndex);
                    this.expectTokenMatch([SYMBOL, '[']);
                    this.advance();
                    this.compileExpression();
                    
                    // this.write(
                    //     'add',
                    //     'pop pointer 1',
                    //     'push that 0'
                    // );
                    
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
            operator = this.currentTokenValue;
            this.advance();
            this.compileTerm();
            this.write(this.unaryOperatorMap[operator]);
        
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
    
    CompilationEngine.prototype.getSegment = function(kind){
        var segment;
        segment = this.kindMap[kind];
        if(segment === undefined){
            throw new Error('No segement mapped for kind: "' + kind + '"');
        }
        return segment;
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
        str += '}';
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