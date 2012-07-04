#!/usr/bin/env node

(function(){
    var source, Lexer;
    
    source = 'if (x < 153) {let city = "Paris";}';
    
    /**
     *`Lexer` is an implementation of a configurable deterministic finite
     * state automaton used for text scanning.
     *
     * As is conventional, this implementation always returns the longest match
     * possible on each call to retrieve the next token.
     */
    Lexer = function(stream){
        this.state = null;
        this.transitions = null;
        this.startState = 'INIT';
        this.acceptStates = null;
        this.currentMatch = null;
        this.resetState();
        this.position = 0;
        this.stream = stream;
    };
    
    
    Lexer.prototype.match = function(){

        // Method:
        // Keep matching, one character at a time until we cannot match any
        // more characters or we encounter an error. At this point return the
        // previous longest match or None if we have had no matches so far.
        
        var scanLength, matchLength, match, char, matchFound, characters,
            state, nextState, i;

        this.resetState();

        scanLength = 0;
        matchLength = 0;

        while(true){
            if(this.stream.length > (this.position + scanLength)){
                char = this.stream.charAt(this.position + scanLength);
            } else {
                break;
            }
            
            matchFound = false;
            
            for(i=0; i<this.transitions.length; i+=1){
                
                characters = this.transitions[i][0];
                state = this.transitions[i][1];
                nextState = this.transitions[i][2];
                
                if((this.state === state) && (char.match(characters))){
                    matchLength += 1;
                    this.state = nextState;
                    matchFound = true;
                    break;
                }
            }
            if(matchFound === false){
                break;
            }
            scanLength += 1;
        }
        
        
        if((matchLength > 0) && (this.acceptStates.indexOf(this.state) >= 0)){
            match = [
                this.state,
                this.stream.slice(this.position, this.position + matchLength)];
            this.position += matchLength;
            return match;
        }
        
        return null;
    };
    
    Lexer.prototype.resetState = function(){
        this.state = this.startState;
    };

    Lexer.prototype.setTransitions = function(transitions){
        this.transitions = transitions;
    };
    
    Lexer.prototype.setAcceptStates = function(acceptStates){
        this.acceptStates = acceptStates;
    };
    
    Lexer.prototype.hasNext = function(source, position){
        var match = this.match(source, position);
        if(match !== null){
            this.currentMatch = match;
            return true;
        }
        return false;
    };
    
    Lexer.prototype.next = function(){
        return this.currentMatch;
    };
    
    
    (function(){
        var lexer = new Lexer(source),
            matchObj,
            state,
            match;
        
        lexer.setTransitions([
            [/^[a-z|A-Z]$/, "INIT", "IDENTIFIER"],
            [/^[a-z|A-Z]$/, "IDENTIFIER", "IDENTIFIER"],
            [/^[0-9]$/, "IDENTIFIER", "IDENTIFIER"],
            
            [/^[0-9]$/, "INIT", "INTEGER"],
            [/^[0-9]$/, "INTEGER", "INTEGER"],
            
            [/^\s$/, "INIT", "WHITESPACE"],
            [/^\s$/, "WHITESPACE", "WHITESPACE"],
            
            [/^\+|-|\*|\/|\=|<|>$/, "INIT", "OPERATOR"],
            
            [/^\(|\)|\{|\}$/, "INIT", "SYMBOL"],
            
            [/^;$/, "INIT", "END_STATEMENT"],
            
            [new RegExp('^"$'), "INIT", "STRING_CONSTANT_BEGIN"],
            [/^[a-z|A-Z]$/, "STRING_CONSTANT_BEGIN", "STRING_CONSTANT_CONTINUE"],
            [/^[a-z|A-Z]$/, "STRING_CONSTANT_CONTINUE", "STRING_CONSTANT_CONTINUE"],
            [new RegExp('^"$'), "STRING_CONSTANT_CONTINUE", "STRING_CONSTANT"]
        ]);
        
        lexer.setAcceptStates([
            "IDENTIFIER",
            "WHITESPACE",
            "OPERATOR",
            "INTEGER",
            "SYMBOL",
            "END_STATEMENT",
            "STRING_CONSTANT"
        ]);
        
        while(lexer.hasNext()){
            matchObj = lexer.next();
            state = matchObj[0];
            match = matchObj[1];
            
            console.log(matchObj);
        }
    }());
}());