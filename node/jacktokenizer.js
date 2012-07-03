#!/usr/bin/env node

(function(){
    var source, Tokenizer, DFA;
    
    source = 'if (x < 153) {let city = "Paris";}';
    
    
    
    /**
     *`DFA` is an implementation of a configurable deterministic finite
     * state automaton used for text scanning.
     *
     * As is conventional, this implementation always returns the longest match
     * possible on each call to retrieve the next token.
     */
    DFA = function(){
        this.state = null;
        this.transitions = null;
        this.startState = 'INIT';
        this.acceptStates = null;
        this.reset();
    };
    
    
    /**
     * Given the input `stream` and offset `position`, return a match
     * object representing the longest possible sequence of matching
     * characters in the strem from the given offset.
     * 
     * The `match` method returns a tuple describing the match if one was
     * found, otherwise it returns `None`. Match tuples are of the following
     * form:
     *
     *      (token_type, match_string, match_length)
     *
     *   eg.
     *
     *      ("IDENTIFER", "FOO", 3)
     */
    DFA.prototype.match = function(stream, position){

        // Method:
        // Keep matching, one character at a time until we cannot match any
        // more charachters or we encounter an error. At this point return the
        // previous longest match or None if we have had no matches so far.
        
        var offset, match, matchOffset, char, matchFound, characters, state, nextState;

        this.reset()

        offset = 0;
        matchOffset = 0;

        while(true){
            if(stream.length > (position + offset)){
                char = stream.charAt(position + offset);
            } else {
                return this._get_match(position, matchOffset, stream);
            }
            
            matchFound = false;
            
            
            for(var i=0; i<this.transitions.length; i++){
                
                characters = this.transitions[i][0];
                state = this.transitions[i][1];
                nextState = this.transitions[i][2];
                
                if((this.state === state) && (char.match(characters))){
                    matchOffset += 1;
                    this.state = nextState;
                    matchFound = true;
                    break;
                }
            }
            
            
            if(matchFound === false){
                return this._get_match(position, matchOffset, stream);
            }
            offset += 1;
        }
    };
    
    /*
     * If the `DFA` is in an accept state build the match object and
     * return it. Otherwise return null.
     */
    DFA.prototype._get_match = function(position, matchOffset, stream){
        if((matchOffset > 0) && (this.acceptStates.indexOf(this.state) >= 0)){
            return [this.state, stream.slice(position, position + matchOffset), matchOffset];
        }
        return null;
    };
    
    DFA.prototype.reset = function(){
        this.state = this.startState;
    };
    
    
    
    (function(){
        var dfa = new DFA(),
            position = 0,
            matchObj,
            state,
            match,
            offset;
        
        
        dfa.transitions = [
            [/^[a-z|A-Z]$/, "INIT", "IDENTIFIER"],
            [/^[a-z|A-Z]$/, "IDENTIFIER", "IDENTIFIER"],
            [/^[0-9]$/, "IDENTIFIER", "IDENTIFIER"],
            
            [/^[0-9]$/, "INIT", "INTEGER"],
            [/^[0-9]$/, "INTEGER", "INTEGER"],
            
            [/^\.$/, "INTEGER", "FLOAT"],
            
            [/^\.$/, "INIT", "FLOAT"],
            [/^[0-9]$/, "FLOAT", "FLOAT"],
            
            [/^\s$/, "INIT", "WHITESPACE"],
            [/^\s$/, "WHITESPACE", "WHITESPACE"],
            
            [/^\+$/, "INIT", "ADD"],
            [/^-$/, "INIT", "SUBTRACT"],
            [/^\*$/, "INIT", "MULTIPLY"],
            [/^\/$/, "INIT", "DIVIDE"],
            [/^=$/, "INIT", "ASSIGNMENT"],
            [/^\<$/, "INIT", "LESS_THAN"],
            [/^\>$/, "INIT", "GREATER_THAN"],
            
            [/^\($/, "INIT", "LPAREN"],
            [/^\)$/, "INIT", "RPAREN"],
            
            [/^\{$/, "INIT", "LBRACE"],
            [/^\}$/, "INIT", "RBRACE"],
            
            [/^;$/, "INIT", "END_STATEMENT"],
            
            [new RegExp('^"$'), "INIT", "DOUBLE_QUOTE"],
        ];
        
        dfa.acceptStates = [
            "IDENTIFIER",
            "WHITESPACE",
            "ADD",
            "SUBTRACT",
            "MULTIPLY",
            "DIVIDE",
            "ASSIGNMENT",
            "LPAREN",
            "RPAREN",
            "INTEGER",
            "FLOAT",
            "LBRACE",
            "RBRACE",
            "END_STATEMENT",
            "LESS_THAN",
            "GREATER_THAN",
            "DOUBLE_QUOTE"
        ];
        
        matchObj = dfa.match(source, position);
        while(matchObj !== null){
            state = matchObj[0];
            match = matchObj[1];
            offset = matchObj[2];
            
            console.log(matchObj);
            position += offset;
            matchObj = dfa.match(source, position);
        }
        
    }());
}());