#!/usr/bin/env node

(function(){
    var source, Tokenizer, fs, fd;
    
    fs = require('fs');
    fd = fs.openSync(process.argv[2], 'r');
    source = fs.readSync(fd, 1024*4, 0, 'ASCII')[0];
    
    Tokenizer = function(stream){
        this.currentMatch = null;
        this.stream = stream;
        
        this.config = [
            [/^[a-z|A-Z]+[a-z|A-Z|0-9]*/, 'IDENTIFIER'],
            [/^[0-9]+/, 'INTEGER'],
            [/^\s+/, 'WHITESPACE'],
            [/^\+|-|\*|\/|\=|<|>|\(|\)|\{|\}|;|,|\./, 'SYMBOL'],
            [/^"(.*)"/, 'STRING'],
            [/^\/\/.*[\r\n|\r|\n]/, 'SINGLE_LINE_COMMENT'],
            [/^\/\*\*(.|\r\n|\r|\n)*?\*\//, 'MULTI_LINE_COMMENT']
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
            'WHITESPACE',
            'SINGLE_LINE_COMMENT',
            'MULTI_LINE_COMMENT'
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
        if((matchType === 'IDENTIFIER') && 
                (this.keywords.indexOf(bestMatch) >= 0)){
                    
            return ['KEYWORD', bestMatch];
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
    
    (function(){
        var tokenizer = new Tokenizer(source),
            matchObj,
            type,
            match;
        
        console.log('<tokens>');
        
        while(tokenizer.hasNext()){
            matchObj = tokenizer.next();
            type = matchObj[0];
            match = matchObj[1];
            
            console.log('<' + type.toLowerCase() + '> ' + match + ' </' + type.toLowerCase() + '>');
        }
        
        console.log('</tokens>');
    }());
}());