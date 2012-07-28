(function(){
    
    var STATIC = 'static',
        FIELD = 'field',
        ARG = 'arg',
        VAR = 'var',
        
        SymbolTable,
        SymbolKinds,
    
    SymbolKinds = {};
    SymbolKinds.STATIC = STATIC;
    SymbolKinds.FIELD = FIELD;
    SymbolKinds.ARG = ARG;
    SymbolKinds.VAR = VAR;
    
    
    SymbolTable = function(){
        this.staticScope = {};
        this.subroutineScope = {};
        this.counts = {};
        this.counts[STATIC] = 0;
        this.counts[FIELD] = 0;
        this.counts[ARG] = 0;
        this.counts[VAR] = 0;
        this.scopes = null;
        this.resetSubroutineScope();
    };
    
    /**
     * Starts a new subroutine scope (ie. resets the subroutine symbol table).
     */
    SymbolTable.prototype.startSubroutine = function(){
        var k, symbolObj;
        
        for(k in this.subroutineScope) {
            if(this.subroutineScope.hasOwnProperty(k)){
                symbolObj = this.subroutineScope[k];
                this.counts[symbolObj.kind] -= 1;
            }
        }
        this.resetSubroutineScope();
    };

    SymbolTable.prototype.resetSubroutineScope = function(){
        this.subroutineScope = {};
        this.scopes = [this.subroutineScope, this.staticScope];
    };
    
    /**
     * Define a new symbol with the given type and 'kind', which also
     * determines the symbol's scope.
     *
     * Kinds are STATIC, FIELD, ARG or VAR. STATIC and FIELD have class scope,
     * ARG and VAR have subroutine scope.
     */
    SymbolTable.prototype.define = function(name, type, kind){
        var scope, symbolObj;
        switch(kind){
            
            case STATIC:
            case FIELD:
                scope = this.staticScope;
                break;
                
            case ARG:
            case VAR:
                scope = this.subroutineScope;
                break;
            
            default:
                throw new Error('Invalid scope kind:"'+ kind + '"');
                break;
        }
        
        symbolObj = {type: type, kind:kind, index: this.counts[kind]};
        scope[name] = symbolObj;
        this.counts[kind] +=1;
        return symbolObj;
    };
    
    /**
     * Returns the number of symbols of the given kind defined in the current
     * scope.
     */
    SymbolTable.prototype.varCount = function(kind){
        return this.counts[kind];
    };
    
    /**
     * Returns the kind of a symbol in the current scope, or null if symbol is
     * not defined.
     */
    SymbolTable.prototype.kindOf = function(name){
        return this.getSymbolAttr(name, 'kind');
    };
    
    /**
     * Returns the type of a symbol in the current scope, or null if it is not
     * defined.
     */
    SymbolTable.prototype.typeOf = function(name){
        return this.getSymbolAttr(name, 'type');
    };
    
    /**
     * Returns the index assigned to the named symbol.
     */
    SymbolTable.prototype.indexOf = function(name){
        return this.getSymbolAttr(name, 'index');
    };
    
    SymbolTable.prototype.getSymbolAttr = function(name, attr){
        var i;
        for(i=0; i<this.scopes.length; i+=1){
            if(this.scopes[i].hasOwnProperty(name)){
                return this.scopes[i][name][attr];
            }
        }
        throw new Error('Undefined symbol: "' + name + '"');
    };
    
    exports.SymbolTable = SymbolTable;
    exports.SymbolKinds = SymbolKinds;
    
}());