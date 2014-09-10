/*

Test offline insert/update/remove

So Client A is initializing but then goes offline and makes some changes.
After etc. are done it goes back online and we'll check the data on the server
and on Client B

ClientA will prefix data "clienta" in localstorage and ClientB will use "clientb"
doing so will disable tab sync and the two will act as seperate clients.

*/

GroundTest.add('Test common offline insert/update/remove', function() {

  var clientA = new this.Client('A');

  var clientB = new this.Client('B');

  var server = new this.Server();

  // Step 0
  server('Clean db', function(complete) {
    db.remove({});
    complete();
  });

  // Step 1
  clientA('Create document on the client', function(complete) {
    localStorage.clear();

    Meteor.disconnect();
    
    db = new GroundDB('test', { prefix: 'clienta' });

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
    
    complete();

  });

  // Step 4
  clientA('Connect and wait 2 sec for the system to sync', function(complete) {

    Meteor.reconnect();

    Meteor.setTimeout(function() {
      complete();
    }, 2000);
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

  // Step 6
  clientB('Verify created document', function(complete) {
    db = new GroundDB('test', { prefix: 'clientb' });

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

  // Step 8
  clientB('Verify updated document', function(complete) {
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

    if (doc) {
      complete('Document not removed');
    } else {
      complete();
    }
  });

  // Step 10
  clientB('Verify removed document', function(complete) {
    var doc = db.findOne({ test: 3 });

    if (doc) {
      complete('Document not removed');
    } else {
      complete();
    }
  });

});