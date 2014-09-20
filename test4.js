/*

Test offline resume

So Client A is initializing but then goes offline and makes some changes.
After etc. are done it goes back online and we'll check the data on the server
and on Client B

ClientA will prefix data "clienta" in localstorage and ClientB will use "clientb"
doing so will disable tab sync and the two will act as seperate clients.

*/

GroundTest.add('Test offline resume actions', function() {

  var clientA = new this.Client('A');

  var server = new this.Server();

  // Step 0
  server('Clean db', function(complete) {
    console.log('---------------- TEST 4 - CLEAR DB --------------');
    db.remove({});
    complete();
  });

  clientA('Clear localStorage', function(complete) {    
    localStorage.clear();

    db = new GroundDB('test');

    if (db.findOne()) {
      complete('Database is not empty');
    } else {
      complete();
    }

    // All rigged - got an empty db now go offline...
    Meteor.disconnect();

  });

  server('Check clean db', function(complete) {
    if (db.findOne()) {
      complete('Database is not empty');
    } else {
      complete();
    }
    console.log('---------------- TEST 4 - CLEARED DB --------------');
    console.log('(Note: Server should be silente here...)');
  });  

  // Step 1
  clientA('Create document on the client', function(complete) {

      
    db.insert({ test: 1, foo: 'test_new_document', bar: 'online', comment: 'TEST 4' }); // create
    db.insert({ test: 2, foo: 'test_new_document', bar: 'online', comment: 'TEST 4' }); // update
    db.insert({ test: 3, foo: 'test_new_document', bar: 'online', comment: 'TEST 4' }); // remove

    complete();

  });

  // Step 2
  clientA('Update document on the client', function(complete) {
    var doc = db.findOne({ test: 2 });

    if (!doc) { complete('Document not found...'); return; }

    db.update({ _id: doc._id }, { $set: { foo: 'test_update_document' } });
    
    complete();
  });

  // Step 3
  clientA('Remove document on the client', function(complete) {
    var doc = db.findOne({ test: 3 });

    if (!doc) { complete('Document not found...'); return; }

    db.remove({ _id: doc._id });
    
    Meteor.setTimeout(function() {
      //complete(localStorage.getItem('_storage._methods_.db.methods'));
      complete();
    }, 1000);

  });

  // Step 3
  clientA('Close the client', function(complete) {


    var _getMethodsList = function() {
      // Array of outstanding methods
      var methods = [];
      // Made a public API to disallow caching of some method calls
      // Convert the data into nice array
      _.each(db.connection._methodInvokers, function(method) {
        // Dont cache login or getServerTime calls - they are spawned pr. default
        methods.push({
          // Format the data
          method: method._message.method,
          args: method._message.params,
          options: { wait: method._wait }
        });
      });
      return methods;
    };


    var methods = localStorage.getItem('_storage._methods_.db.methods');
    var actualMethods = JSON.stringify(_getMethodsList());
    
    if (!methods || methods == '[[false,true,null],[0],[0]]') {
      complete('Outstanding methods are not stored in localstorage! Got: "' + methods + '" - real: "' + actualMethods + '"');
    } else {
      var operationCount = MiniMax.parse(methods).length;
      if (operationCount == 5) {
        complete();
      } else {
        complete('Not all Outstanding methods in there');
      }
    }

  });

  server('Check clean db', function(complete) {
    if (db.findOne()) {
      complete('Database is not empty');
    } else {
      complete();
    }
    console.log('---------------- TEST 4 - END --------------');
  }); 

});


GroundTest.add('Test offline resume actions - Verify', function() {
  var clientA = new this.Client('A');

  var server = new this.Server();

  clientA('Go offline', function(done) {
    Meteor.disconnect();
    done();
  });

  server('Init', function(complete) {
    console.log('---------------- TEST 5 - WATCHING DB --------------');
    complete();
  });

  // Step 1
  clientA('Restart client and wait for resumed methods to return', function(complete) {

    // We just made a hard boot of the client - and we pause the connection just
    // a bit to check up on stuff
    var counter = 0;
    var errors = 0;

    GroundDB.addListener('method', function(method, err, result) {
      console.log('Method returned:', JSON.stringify(method));
      counter++;
      if (err) errors++;
      if (counter == 5) {

        if (errors)
          complete('Methods failed: ' + errors)
        else
          complete();
      }
    });
    console.log('LISTENER ADDED');

    // Create the grounddb
    db = new GroundDB('test');

    Meteor.reconnect();

    Meteor.setTimeout(function() {
      if (counter < 5) complete('Methods failed ' + counter + ' methods returned');
    }, 2000);

  });

  // Step 5
  clientA('Verify created document', function(complete) {
    var doc = db.findOne({ test: 1 });

    if (doc) {
      
      if (doc.foo == 'test_new_document' && doc.bar == 'online') {
        complete();
      } else {
        complete('Document is found but contains invalid data');
      }

    } else {
      complete('Could not find any documents matching');
    }
  });

  // Step 5
  server('Verify created document', function(complete) {
    var doc = db.findOne({ test: 1 });

    if (doc) {
      
      if (doc.foo == 'test_new_document' && doc.bar == 'online') {
        complete();
      } else {
        complete('Document is found but contains invalid data');
      }

    } else {
      complete('Could not find any documents matching');
    }
  });

  // Step 7
  clientA('Verify updated document', function(complete) {
    var doc = db.findOne({ test: 2 });

    if (doc) {
      
      if (doc.foo == 'test_update_document' && doc.bar == 'online') {
        complete();
      } else {
        complete('Document is found but contains invalid data');
      }

    } else {
      complete('Could not find any documents matching');
    }
  });

  // Step 7
  server('Verify updated document', function(complete) {
    var doc = db.findOne({ test: 2 });

    if (doc) {
      
      if (doc.foo == 'test_update_document' && doc.bar == 'online') {
        complete();
      } else {
        complete('Document is found but contains invalid data');
      }

    } else {
      complete('Could not find any documents matching');
    }
  });


  // Step 9
  clientA('Verify removed document', function(complete) {
    var doc = db.findOne({ test: 3 });

    var count = db.find().count();

    if (doc) {
      complete('Document not removed ' + count);
    } else {
      complete();
    }
  });

  // Step 9
  server('Verify removed document', function(complete) {
    var doc = db.findOne({ test: 3 });

    var count = db.find().count();

    if (doc) {
      complete('Document not removed ' + count);
    } else {
      complete();
    }
  });

  // Step 9
  clientA('clear localStorage', function(complete) {
    localStorage.clear();
    complete();
  });  

});