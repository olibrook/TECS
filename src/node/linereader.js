var fs = require('fs');


function LineReader(path){
    
    // Contents of the file gets read into a string as we scan for newlines.
    this.buffer = "";
    
    // Scan position into this.buffer for newline characters.
    this.newlinePosition = 0;
    
    // Amount read from the file at a time.
    this.chunkSize = 1024;
    this.path = path;
    this.fd = null;
    this.position = 0;
}


LineReader.prototype = {
    
    open: function(){
        this.fd = fs.openSync(this.path, "r");
    },
    
    close: function(){
        fs.closeSync(this.fd);
    },
    
    _read: function(){
        var result = fs.readSync(this.fd, this.chunkSize, this.position, 'ASCII'),
            content = result[0],
            bytesRead = result[1];
        
        this.position += bytesRead;
        this.buffer += content;
        return bytesRead;
    },
    
    _readUntilLineOrEOF: function(){
        var lineEnd = -1, bytesRead;

        while(lineEnd === -1){
            lineEnd = this.buffer.indexOf('\n', this.newlinePosition);

            if(lineEnd === -1){
                this.newlinePosition = this.buffer.length -1;

                bytesRead = this._read();

                if(bytesRead===0) {
                    // End of file. Return true if the buffer is not empty,
                    // treat the last line in the file as a full line if not
                    // terminated by a newline.
                    return this.buffer.length > 0;
                }
            }
        }
        this.newlinePosition = lineEnd;
        return true;
    },
    
    hasLines: function(){
        return this._readUntilLineOrEOF();
    },
    
    next: function(){
        var ret = this.buffer.slice(0, this.newlinePosition);
        this.buffer = this.buffer.slice(this.newlinePosition + 1); // Skip the newline itself.
        this.newlinePosition = 0;
        return ret;
    }
}


exports.LineReader = LineReader;