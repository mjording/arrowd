(function($) {
    
  function CpsA(cps) {  
    this.cps = cps; 
  };
 
  CpsA.prototype.CpsA = function() {     
    return this;
  };
  
  CpsA.prototype.next = function(g) {      
    var f = this; 
    g = g.CpsA();
    return new CpsA(function(x, k) {     
      f.cps(x, function(y) {   
         g.cps(y, k );
      }); 
    }); 
  };
  
  CpsA.prototype.run = function(x) {
      this.cps(x, function () { });
  };
 
  CpsA.prototype.CpsA = function() {     
    return this;
  };
  
  CpsA.prototype.next = function(g) {      
    var f = this; 
    g = g.CpsA();
     return new CpsA(function(x,k) {     
      f.cps(x, function(y){   
         g.cps(y, k);
      }); 
    }); 
  };
  
  CpsA.prototype.run = function(x) {
      this.cps(x, function(){ });
  };
 
  Function.prototype.CpsA = function(){
     var f = this;
     return new CpsA(function(x, k) {
         k(f(x));
     });
  };
  
  function AsyncA(cps) { this.cps = cps; }
 
  function ProgressA(){
    if (!( this instanceof ProgressA)){
      return new ProgressA();
    }
    this.cancellers = [];
    this.observers = [];
  };
  
  AsyncA.prototype.AsyncA = function() { return this; };
  
  AsyncA.prototype.next = function(g) {
    var f = this; g = g.AsyncA();
    return new AsyncA(function(x, p, k){
      f.cps(x, p, function(y, q) {
        g.cps(y, q, k );
      });
    });
  };
  
  AsyncA.prototype.run = function(x, p) {
    p = p || new ProgressA();
    this .cps(x, p, function (){});
    return p;
  };
  
  Function.prototype.AsyncA = function() {
    var f = this;
    return new AsyncA(function(x,p,k){k(f(x),p);});
  };
    
  AsyncA.prototype.repeat = function(interval){
    var f = this;
    interval = interval || 0;
 
    return new AsyncA(function rep(x,p,k){
      return f.cps(x,p,function(y,q){
         if(y.Repeat){
            function cancel(){ clearTimeout(tid); }
            q.addCanceller( cancel );
            var tid = setTimeout(function(){
                q.advance(cancel);
                rep(y.value,q,k);
                  }, interval);
               } else if(y.Done){
                   k(y.value, q);
               } else {
                  throw new TypeError("Repeat or Done?");
               }
            });
    });
  };
  
  function Repeat(x){ return { Repeat:true, value:x }; }
 
  function Done(x){ return { Done:true, value:x }; }
 
    
  ProgressA.prototype = new AsyncA(function(x, p, k) {
    this.observers.push(function(y) { k(y, p); });
  });
  
  ProgressA.prototype.addCanceller = function( canceller ) {
    this.cancellers .push( canceller );
  };
  
  ProgressA.prototype.advance = function( canceller ) {
    var index = this.cancellers.indexOf( canceller );
    if (index >= 0) {
      
         this.cancellers.splice(index , 1);
       }
    while ( this.observers.length > 0){
      this.observers.op()();
    }
  };
  
  ProgressA.prototype.cancel = function() {
    while ( this.cancellers.length > 0){
      this.cancellers.pop()();
    }
      
  };
  
  Function prototype.repeat = function(interval){
     return this.AsyncA().repeat(interval);
  }
 
  AsyncA.prototype.or = function(g){
    var f = this;
    g = g.AsyncA();
    return new AsyncA(function(x,p,k){
 
        var p1 = new ProgressA();
        var p2 = new ProgressA();
        /* if one advances, cancel the other */
        p1.next(function(){ p2.cancel();
		      p2 = null; }).run();
        p2.next(function(){p1.cancel();
     			 p1 = null; }).run();
        function cancel(){
          if(p1) p1.cancel();
          if(p2) p2.cancel();
        }
       
        function join(y, q){
          p.advance(cancel);
          k(y,q);
        }
    
        p.addCanceller(cancel);
            f.cps(x, p1, join);
            g.cps(x, p2, join);
      });
  };
 
 
  function EventA(eventname) {
    if (!( this instanceof EventA))
      return new EventA(eventname);
    this.eventname = eventname;
  };
  
  EventA.prototype = new AsyncA(function(target, p, k) {
      var f = this ;
      function cancel() {
           target.removeEventListener(f .eventname, handler, false );
      }
      function handler(event) {
           p.advance(cancel );
           cancel();
           k(event, p);
      }
      p. addCanceller( cancel );
      target.addEventListener( f.eventname, handler, false );
  });
    
});
