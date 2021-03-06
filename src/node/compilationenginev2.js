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
     * Top-down parser and compiler for the Jack programming language.
     */
    CompilationEngine = function(){
        
        // Maps symbol kinds to the corresponding segment at the VM level.
        this.kindMap = {
            'var': 'local',
            'arg': 'argument',
            'field': 'this',
            'static': 'static'
        };
        
        // Maps operators to the corresponding VM/OS operations.
        this.operatorMap = {
            '+': 'add',
            '-': 'sub',
            '*': 'call Math.multiply 2',
            '/': 'call Math.divide 2',
            '&': 'and',
            '|': 'or',
            '<': 'lt',
            '>': 'gt',
            '=': 'eq'
        };
        
        // Maps unary operators to corresponding VM operations (note that
        // '-' exists as a unary and a binary operation).
        this.unaryOperatorMap = {
            '-': 'neg',
            '~': 'not'
        };
        
        // Maps constants to the VM code used to push the constant onto the
        // stack.
        this.constants = {
            'true': ['push constant 0', 'not'],
            'false': ['push constant 0'],
            'null': ['push constant 0'],
            'this': ['push pointer 0']
        };
        
        // Counters used to generate unique labels in the VM code for looping
        // constructs.
        this.whileStatementCount = 0;
        this.ifStatementCount = 0;
    };
    
    /**
     * Compile a class using the supplied tokenizer and symbol table.
     *
     */
    CompilationEngine.prototype.main = function(tokenizer, out, symbolTable, includeSymbolComments){
        this.tokenizer = tokenizer;
        this.out = out;
        this.currentTokenType = null;
        this.currentTokenValue = null;
        this.symbolTable = symbolTable;
        this.currentClassName = null;
        this.includeSymbolComments = includeSymbolComments;
        
        this.compileClass();
    };
    
    /**
     * Advances the tokenizer.
     *
     */
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
    
    /**
     * Returns true if the current token type matches on of the supplied
     * arguments.
     */
    CompilationEngine.prototype.typeMatch = function(){
        var i;
        for(i=0; i<arguments.length; i+=1){
            if(this.currentTokenType === arguments[i]){
                return true;
            }
        }
        return false;
    };
    
    /**
     * Raises an exception of the current token type does not match one of the
     * supplied arguments.
     */
    CompilationEngine.prototype.assertTypeMatch = function(){
        if(!this.typeMatch.apply(this, arguments)){
            throw new Error('Unexpected token type. Found "'
                    + this.currentTokenType + '", expected one of "'
                    + this.printArgs(arguments) + '"');
        }
    };
    
    /**
     * Advances the tokenizer and asserts that new token type matches one of
     * the supplied arguments.
     */
    CompilationEngine.prototype.expectTypeMatch = function(){
        this.advance();
        this.assertTypeMatch.apply(this, arguments);
    };
    
    /**
     * Returns true if the current token value matches one of the supplied
     * arguments.
     */
    CompilationEngine.prototype.valueMatch = function(){
        var i;
        for(i=0; i<arguments.length; i+=1){
            if(this.currentTokenValue === arguments[i]){
                return true;
            }
        }
        return false;
    };
    
    /**
     * Raises an exception of the current token value does not match one of the
     * supplied arguments.
     */
    CompilationEngine.prototype.assertValueMatch = function(){
        if(!this.valueMatch.apply(this, arguments)){
            throw new Error('Unexpected token value. Found "'
                    + this.currentTokenValue + '", expected one of "'
                    + this.printArgs(arguments) + '"');
        }
    };
    
    /**
     * Advances the tokenizer and asserts that new token value matches one of
     * the supplied arguments.
     */
    CompilationEngine.prototype.expectValueMatch = function(){
        this.advance();
        this.assertValueMatch.apply(this, arguments);
    };
    
    /**
     * Returns true if the current token type and value match one of the
     * supplied arguments.
     *
     * Arguments are two element arrays of the form [TYPE, VALUE]
     */
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
    
    /**
     * Raises an exception if the current token type and value do not match
     * one of the supplied arguments.
     *
     * Arguments are two element arrays of the form [TYPE, VALUE]
     */
    CompilationEngine.prototype.assertTokenMatch = function(){
        if(!this.tokenMatch.apply(this, arguments)){
            throw new Error('Unexpected token. Found "' 
                    + [this.currentTokenType, this.currentTokenValue].toString()
                    + '", expected one of "' + this.printArgs(arguments) + '"');
        }
    };
    
    /**
     * Advances the tokenizer and asserts that the new token type and value
     * match one of the supplied arguments.
     *
     * Arguments are two element arrays of the form [TYPE, VALUE]
     */
    CompilationEngine.prototype.expectTokenMatch = function(){
        this.advance();
        this.assertTokenMatch.apply(this, arguments);
    };
    
    /**
     * Converts a JS arguments object to a readable string, suitable for
     * logging.
     */
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
    
    
    /**
     * Compiles a class, the top-level structure in a Jack program, and
     * therefore the main method on the compiler.
     */
    CompilationEngine.prototype.compileClass = function(){
        this.expectTokenMatch([KEYWORD, 'class']);
        
        this.expectTypeMatch(IDENTIFIER);
        this.currentClassName = this.currentTokenValue;
        
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
    
    /**
     * Compiles a class variable declaration, either static or a field.
     */
    CompilationEngine.prototype.compileClassVarDec = function(){
        var type, kind;
        
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
        this.define(this.currentTokenValue, type, kind);
        
        this.advance();
        
        if(this.tokenMatch([SYMBOL, ','])){
            
            while(!this.tokenMatch([SYMBOL, ';'])){
                
                this.assertTokenMatch([SYMBOL, ',']);
                
                this.expectTypeMatch(IDENTIFIER);
                this.define(this.currentTokenValue, type, kind);
                
                this.advance();
            }
        }
        this.advance();
    };
    
    /*
     * Compiles a subroutine declaration, (method, function, constructor),
     * making adjustments in the output VM code for the 'this' argument if the
     * subroutine is a method.
     */
    CompilationEngine.prototype.compileSubroutine = function(){
        var type, subroutineName;
        
        type = this.currentTokenValue;
        
        this.symbolTable.startSubroutine();
        this.ifStatementCount = 0;
        this.whileStatementCount = 0;
        
        this.expectTypeMatch(KEYWORD, IDENTIFIER);
        
        this.expectTypeMatch(IDENTIFIER);
        subroutineName = this.currentClassName + '.' + this.currentTokenValue;
        
        
        if(type === 'method'){
            // Methods are always called with an implicit first argument which
            // is the 'this' object and is an instance of this class.
            
            this.define('this', this.currentClassName, SymbolKinds.ARG);
        }
        
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

        if(type === 'constructor'){
            // Need to allocate memory space for the class' fields
            this.write(
                'push constant ' + this.symbolTable.varCount(SymbolKinds.FIELD),
                'call Memory.alloc 1',
                'pop pointer 0'
            );
        }
        
        if(type === 'method'){
            // Need to adjust the pointer to the 'this' object, which is passed
            // as argument 0.
            
            this.write(
                'push argument 0',
                'pop pointer 0'
            );
        }
        
        
        if(this.typeMatch(KEYWORD) && 
                this.valueMatch('let', 'if', 'while', 'do', 'return')){
            
            this.compileStatements();
        }
        
        this.assertTokenMatch([SYMBOL, '}']);
        this.advance();
    };
    
    /**
     * Compiles a parameter list in a subroutine declaration, returning the
     * number of parameters which were encountered.
     */
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
    
    /**
     * Compiles a variable declaration inside of a subroutine.
     */
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
    
    /**
     * Compiles a statement.
     */
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
    
    /**
     * Compiles a do-statement - subroutine call without using the return value.
     */
    CompilationEngine.prototype.compileDo = function(){
        this.expectTypeMatch(IDENTIFIER);
        this.compileSubroutineCall();
        this.write('pop temp 0');
        this.assertTokenMatch([SYMBOL, ';']);
        this.advance();
    };
    
    /**
     * Compiles subroutine call, respecting setting of the 'this' argument
     * to the subroutine in the event that the subroutine is a method.
     */
    CompilationEngine.prototype.compileSubroutineCall = function(){
        var classOrInstanceName, subroutineName, numExpressions,
            fullSubroutineName, instanceIndex, instanceType, extraArgsCount,
            implicitThis, instanceKind;
        
        extraArgsCount = 0;
        implicitThis = false;
        
        this.assertTypeMatch(IDENTIFIER);
        subroutineName = this.currentTokenValue;
        this.expectTypeMatch(SYMBOL);
        
        if(this.valueMatch('.')){
            classOrInstanceName = subroutineName;
            this.expectTypeMatch(IDENTIFIER);
            subroutineName = this.currentTokenValue;
            this.expectTokenMatch([SYMBOL, '(']);
        } else {
            implicitThis = true;
        }
        
        instanceType = this.symbolTable.typeOf(classOrInstanceName);
        
        if(implicitThis || instanceType !== null){
            
            // Looks like this is a method call, so fix the 'this' argument.
            
            if(implicitThis){
                
                fullSubroutineName = this.currentClassName + '.' + subroutineName;
                this.write('push pointer 0');
                extraArgsCount += 1;
                
            } else {
                
                instanceIndex = this.symbolTable.indexOf(classOrInstanceName);
                instanceKind = this.symbolTable.kindOf(classOrInstanceName);
                
                fullSubroutineName = instanceType + '.' + subroutineName;
                this.write('push ' + this.kindMap[instanceKind] + ' ' + instanceIndex);
                extraArgsCount += 1;
            }
            
        } else {
            
            // Assume call to a class function. Since the compiler doesn't pre-scan
            // source files to be able to check for undefined symbols, just assume
            // the names in the source code are correct.
            
            fullSubroutineName = classOrInstanceName + '.' + subroutineName;
        }
        
        this.advance();
        numExpressions = this.compileExpressionList();
        this.assertTokenMatch([SYMBOL, ')']);
        
        this.write('call ' + fullSubroutineName + ' ' + (numExpressions + extraArgsCount));
        this.advance();
    };
    
    /**
     * Compiles a let statement, including assignments to Array elements using
     * base addresses, offsets and pointers.
     */
    CompilationEngine.prototype.compileLet = function(){
        var symbolName, symbolKind, symbolIndex, isPointerAssignment;
        
        isPointerAssignment = false;
        
        this.expectTypeMatch(IDENTIFIER);
        
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
    
    /**
     * Compiles a while statement, creating unique labels and gotos in the
     * output VM code.
     */
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
        );
        
        this.expectTokenMatch([SYMBOL, '{']);
        
        this.advance();
        this.compileStatements();
        
        this.assertTokenMatch([SYMBOL, '}']);
        
        this.write(
            'goto WHILE_EXP' + currentWhileCount,
            'label WHILE_END' + currentWhileCount
        );
        
        this.advance();
    };
    
    /**
     * Compiles a return statement, returning null in the event that the
     * statement does not explicitly return a value.
     */
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
    
    /**
     * Compiles an if statement, complete with labels and gotos in the output
     * VM code.
     */
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
        
        this.assertTokenMatch([SYMBOL, '}']);
        this.advance();
        
        if(this.tokenMatch([KEYWORD, 'else'])){
            this.write('goto IF_END' + cachedCount);
            this.write('label IF_FALSE' + cachedCount);
            
            this.expectTokenMatch([SYMBOL, '{']);
            
            this.advance();
            this.compileStatements();
            
            this.assertTokenMatch([SYMBOL, '}']);
            
            this.advance();
            this.write('label IF_END' + cachedCount);
        } else {
            this.write('label IF_FALSE' + cachedCount);
        }
    };
    
    /**
     * Compiles an expression, defined as:
     * 
     * expression: term (op term)*
     */
    CompilationEngine.prototype.compileExpression = function(){
        var operator;
        
        this.compileTerm();
        
        while(this.typeMatch(SYMBOL) && this.valueMatch('+', '-', '*', '/', '&', '|', '<', '>', '=')){
            operator = this.operatorMap[this.currentTokenValue];
            
            this.advance();
            this.compileTerm();
            
            this.write(operator);
        }
    };
    
    /**
     * Compiles a term - the trickiest part of the compiler.
     */
    CompilationEngine.prototype.compileTerm = function(){
        var lookAheadMatch, lookAheadType, lookAheadValue, termType, i,
            symbolName, symbolKind, symbolIndex, operator;
        
        if(this.typeMatch(STRING_CONST)){
            this.write(
                'push constant ' + this.currentTokenValue.length,
                'call String.new 1'
            );
            for(i=0; i<this.currentTokenValue.length; i+=1){
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
                    
                    this.write('push ' + this.getSegment(symbolKind) + ' ' + symbolIndex);
                    this.advance();
                    break;
                    
                case 'arrayEntry':
                    symbolName = this.currentTokenValue;
                    symbolKind = this.symbolTable.kindOf(symbolName);
                    symbolIndex = this.symbolTable.indexOf(symbolName);
                    
                    // Compile the expression, giving the array offset.
                    this.expectTokenMatch([SYMBOL, '[']);
                    this.advance();
                    this.compileExpression();
                    
                    // Push the base address of the array
                    this.write('push ' + this.getSegment(symbolKind) + ' ' + symbolIndex);
                    
                    this.write(
                        'add',              // Base + offset
                        'pop pointer 1',    // Pop the address to the pointer segment
                        'push that 0'       // Push the value of the Array element using the pointer.
                    );
                    
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
    
    /**
     * Compiles an expression list, as in the arguments to a subroutine call.
     */
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
    
    /**
     * Returns the name of the segment which is used to store symbols of the
     * given kind in the underlying VM implementation.
     */
    CompilationEngine.prototype.getSegment = function(kind){
        var segment;
        segment = this.kindMap[kind];
        if(segment === undefined){
            throw new Error('No segment mapped for kind: "' + kind + '"');
        }
        return segment;
    };
    
    /**
     * Defines a new symbol in the symbol table.
     */
    CompilationEngine.prototype.define = function(name, type, kind){
        this.symbolTable.define(name, type, kind);
        // this.write('// [DEFINE] Name: "' + name);
    };
    
    /**
     * Writes strings to the output.
     */
    CompilationEngine.prototype.write = function(){
        var i;
        for(i=0; i<arguments.length; i+=1){
            this.out.write(arguments[i]);
        }
    };
    
    exports.CompilationEngine = CompilationEngine;
    
}());