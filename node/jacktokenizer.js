#!/usr/bin/env node

(function(){
    var Tokenizer,
    
        IDENTIFIER = 'IDENTIFIER',
        INT_CONST = 'INT_CONST',
        WHITESPACE = 'WHITESPACE',
        SYMBOL = 'SYMBOL',
        STRING_CONST = 'STRING_CONST',
        SINGLE_LINE_COMMENT = 'SINGLE_LINE_COMMENT',
        MULTI_LINE_COMMENT = 'MULTI_LINE_COMMENT',
        KEYWORD = 'KEYWORD';
    
    Tokenizer = function(stream){
        this.currentMatch = null;
        this.stream = stream;
        
        this.config = [
            [/^[a-z|A-Z]+[a-z|A-Z|0-9]*/, IDENTIFIER],
            [/^[0-9]+/, INT_CONST],
            [/^\s+/, WHITESPACE],
            [/^\+|-|\*|\/|\=|<|>|\(|\)|\{|\}|;|,|\./, SYMBOL],
            [/^"(.*)"/, STRING_CONST],
            [/^\/\/.*[\r\n|\r|\n]/, SINGLE_LINE_COMMENT],
            [/^\/\*\*(.|\r\n|\r|\n)*?\*\//, MULTI_LINE_COMMENT]
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
            WHITESPACE,
            SINGLE_LINE_COMMENT,
            MULTI_LINE_COMMENT
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
            
            this.stream = this.stream.slice(bestMatchLength);
            
            if(this.ignoredTokenTypes.indexOf(bestMatchType) >= 0){
                continue;
            }
            return this.formatMatch(bestMatchType, bestMatch);
        }
        
        return null;
    };
    
    Tokenizer.prototype.formatMatch = function(matchType, bestMatch){
        // Eurgh. Clearly this is lame.
        if((matchType === IDENTIFIER) && 
                (this.keywords.indexOf(bestMatch) >= 0)){
                    
            return [KEYWORD, bestMatch];
        }
        return [matchType, bestMatch];
    };
    
    Tokenizer.prototype.hasNext = function(){
        var match = this.match();
        if(match !== null){
            this.currentMatch = match;
            return true;
        }
        return false;
    };
    
    Tokenizer.prototype.next = function(){
        return this.currentMatch;
    };
    
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
        return parseInt(this.currentMatch[0], 10);
    };

    Tokenizer.prototype.stringVal = function(){
        return this.currentMatch[1].slice(1, this.currentMatch.length-1);
    };
    
    exports.Tokenizer = Tokenizer;
    
}());