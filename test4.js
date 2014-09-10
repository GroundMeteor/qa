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
    db.remove({});
    complete();
  });

  clientA('Clear localStorage', function(complete) {    
    localStorage.clear();

    db = new GroundDB('test', { prefix: 'clienta' });

    if (db.findOne()) {
      complete('Database is not empty');
    } else {
      complete();
    }

  });

  server('Check clean db', function(complete) {
    if (db.findOne()) {
      complete('Database is not empty');
    } else {
      complete();
    }
  });  

  // Step 1
  clientA('Create document on the client', function(complete) {

    // All rigged - got an empty db now go offline...
    Meteor.disconnect();

    // Check the prefex
    if (db.prefix === 'clienta') {
      
      db.insert({ test: 1, foo: 'test_new_document', bar: 'online' }); // create
      db.insert({ test: 2, foo: 'test_new_document', bar: 'online' }); // update
      db.insert({ test: 3, foo: 'test_new_document', bar: 'online' }); // remove

      complete();

    } else {
      complete('Could not prefix database');
    }

  });

  // Step 2
  clientA('Update document on the client', function(complete) {
    var doc = db.findOne({ test: 2 });

    db.update({ _id: doc._id }, { $set: { foo: 'test_update_document' } });
    
    complete();
  });

  // Step 3
  clientA('Remove document on the client', function(complete) {
    var doc = db.findOne({ test: 3 });

    db.remove({ _id: doc._id });
    
    Meteor.setTimeout(function() {
      complete();
    }, 1000);

  });

  // Step 3
  clientA('Close the client', function(complete) {
    var methods = localStorage.getItem('groundDB.methods');
    
    
    if (!methods || methods == '[[false,true,null],[0],[0]]') {
      complete('Outstanding methods are not stored in localstorage!');
    } else {
      var operationCount = MiniMax.parse(methods).length;
      if (operationCount >= 5) {
        complete();
      } else {
        complete('Not all Outstanding methods in there');
      }
    }

  });

});


GroundTest.add('Test offline resume actions - Verify', function() {
  var clientA = new this.Client('A');

  var server = new this.Server();

  // Step 1
  clientA('Restart client as connected wait 3 sec for sync', function(complete) {

    // We just made a hard boot of the client - and we pause the connection just
    // a bit to check up on stuff
    //Meteor.disconnect();

    var methodsBefore = localStorage.getItem('groundDB.methods');
   

    if (!methodsBefore || methodsBefore == '[[false,true,null],[0],[0]]') {
      complete('No methods stored before');
      return;
    }

    // Create the grounddb
    db = new GroundDB('test', { prefix: 'clienta' });


    var methodsAfter = localStorage.getItem('groundDB.methods');

    if (!methodsAfter || methodsAfter == '[[false,true,null],[0],[0]]') {
      complete('After: Outstanding methods are not stored in localstorage!');
      return;
    }

    //Meteor.reconnect();

    Meteor.setTimeout(function() {

      complete();

    }, 5000);

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
  server('Verify removed document', function(complete) {
    var doc = db.findOne({ test: 3 });

    var count = db.find().count();

    if (doc) {
      complete('Document not removed ' + count);
    } else {
      complete();
    }
  });

});