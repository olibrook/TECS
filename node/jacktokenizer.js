#!/usr/bin/env node

(function(){
    var TokenTypes, Tokenizer;
    
    TokenTypes = {
        IDENTIFIER: 'identifier',
        INT_CONST: 'integerConstant',
        WHITESPACE: 'whitespace',
        SYMBOL: 'symbol',
        STRING_CONST: 'stringConstant',
        SINGLE_LINE_COMMENT: 'singleLineComment',
        MULTI_LINE_COMMENT: 'multiLineComment',
        KEYWORD: 'keyword'
    }
    
    Tokenizer = function(stream){
        this.currentMatch = null;
        
        // Used to peek the next match without advancing the tokenizer.
        this.matchCache = null;
        
        this.stream = stream;
        
        this.config = [
            [/^[a-z|A-Z]+[a-z|A-Z|0-9]*/, TokenTypes.IDENTIFIER],
            [/^[0-9]+/, TokenTypes.INT_CONST],
            [/^\s+/, TokenTypes.WHITESPACE],
            [/^\+|-|\*|\/|\=|<|>|\(|\)|\{|\}|;|,|\.|\[|\]|~|\&/, TokenTypes.SYMBOL],
            [/^"(.*)"/, TokenTypes.STRING_CONST],
            [/^\/\/.*[\r\n|\r|\n]/, TokenTypes.SINGLE_LINE_COMMENT],
            [/^\/\*\*(.|\r\n|\r|\n)*?\*\//, TokenTypes.MULTI_LINE_COMMENT]
        ];
        
        this.keywords = [
            'class',
            'method',
            'function',
            'constructor',
            'int',
            'boolean',
            'char',
            'void',
            'var',
            'static',
            'field',
            'let',
            'do',
            'if',
            'else',
            'while',
            'return',
            'true',
            'false',
            'null',
            'this'
        ];
        
        this.ignoredTokenTypes = [
            TokenTypes.WHITESPACE,
            TokenTypes.SINGLE_LINE_COMMENT,
            TokenTypes.MULTI_LINE_COMMENT
        ];
        
    };
    
    Tokenizer.prototype.match = function(){
        var i, match, bestMatch, bestMatchType, bestMatchLength, re, type;
        
        while(this.stream.length > 0){
            bestMatch = bestMatchType = null;
            bestMatchLength = 0;
            
            for(i=0; i<this.config.length; i+=1){
                re = this.config[i][0];
                type = this.config[i][1];
                match = this.stream.match(re);
                
                if(match !== null){
                    if(match[0].length > bestMatchLength){
                        bestMatch = match[0];
                        bestMatchLength = bestMatch.length;
                        bestMatchType = type;
                    }
                }
            }
            
            if(bestMatchLength === 0){
                throw new Error('Could not parse remainder');
            }
            
            if(this.ignoredTokenTypes.indexOf(bestMatchType) >= 0){
                // Advance the stream over ignored token types.
                this.advanceStream(bestMatchLength);
                continue;
            }
            return [bestMatchType, bestMatch, bestMatchLength];
        }
        
        return null;
    };
    
    Tokenizer.prototype.formatMatch = function(matchType, bestMatch){
        // Eurgh. Clearly this is lame.
        if((matchType === TokenTypes.IDENTIFIER) && 
                (this.keywords.indexOf(bestMatch) >= 0)){
                    
            return [TokenTypes.KEYWORD, bestMatch];
        }
        return [matchType, bestMatch];
    };
    
    Tokenizer.prototype.hasNext = function(){
        this.matchCache = this.match();
        if(this.matchCache !== null){
            return true;
        }
        return false;
    };
    
    Tokenizer.prototype.next = function(opts){
        var matchType = this.matchCache[0],
            matchValue = this.matchCache[1],
            matchLength = this.matchCache[2];
        
        this.matchCache = null;
            
        if(opts !== undefined && opts.peek){
            return this.formatMatch(matchType, matchValue);
            
        } else {
            this.currentMatch = this.formatMatch(matchType, matchValue);
            this.advanceStream(matchLength);
            return this.currentMatch;
        }
    };
    
    Tokenizer.prototype.advanceStream = function(length){
        this.stream = this.stream.slice(length);
    }
    
    Tokenizer.prototype.tokenType = function(){
        return this.currentMatch[0];
    };
    
    Tokenizer.prototype.keyWord = function(){
        return this.currentMatch[1];
    };

    Tokenizer.prototype.symbol = function(){
        return this.currentMatch[1];
    };

    Tokenizer.prototype.identifier = function(){
        return this.currentMatch[1];
    };
    
    Tokenizer.prototype.intVal = function(){
        return parseInt(this.currentMatch[1], 10);
    };

    Tokenizer.prototype.stringVal = function(){
        return this.currentMatch[1].slice(1, this.currentMatch[1].length-1);
    };
    
    exports.TokenTypes = TokenTypes;
    exports.Tokenizer = Tokenizer;
    
}());