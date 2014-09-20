/*

  Test to see if tabs syncronize

  Client A is online

  Client B is offline

  Changes made on client A should be updated in client B via tab communication

  If B creates data A should send the data for B

*/



GroundTest.add('Test tab syncronisation', function() {

  // Insert iframe 
  var clientA = new this.Client('A');
  var clientB = new this.Client('B');

  // Use this server
  var server = new this.Server();

  // Step 0
  server('Server removes all data in test collection', function(complete) {
    // Empty test db
    db.remove();

    complete(); 
  });

  // Step 1
  clientA('Rig GroundDB Empty and inserts doc', function(complete) {
    db = new GroundDB('test');

    db.find({}).forEach(function(doc) {
      db.remove({ _id: doc._id });
    });

    db.insert({ foo: 'bar' }, function(err) {
      if (err) {
        complete('Got error while inserting data, Error:' + err.message);
      } else {
        complete();
      }
    });

  });

  // step 2
  clientB('Disconnect, Rig GroundDB, findOne doc', function(complete) {
    Meteor.disconnect();
    db = new GroundDB('test');

    var item = db.findOne({});


    if (!item) {
      complete('could not find any items...');
    } else {

      if (item.foo !== 'bar')
        complete('Could not find item with foo==bar, got: "' + item.foo + '"')
      else
        complete();
    }

  });

  // Step 3
  clientA('findOne doc, update this and wait 1 sec', function(complete) {

    var item = db.findOne({});

    db.update({ _id: item._id }, { foo: 'foo' }, function(err) {
      if (err) {

        complete(err.message);

      } else {

        Meteor.setTimeout(function() {
          complete();
        }, 5000);

      }
    });

  });


  // step 4
  clientB('check offline, then check if tab sync works', function(complete) {
    var connection = Meteor.connection.status();

    if (connection.status == 'connected') {
      complete('Should not be connected...');
      return;
    }

    var item = db.findOne({});

    if (!item || item.foo !== 'foo')
      complete('Could not find item with foo==foo tabs did not sync?')
    else
      complete();

  });

  // step 4
  clientB('make an offline change', function(complete) {

    db.insert({ test: 1, comment: 'Created by offline tab'});

    Meteor.setTimeout(function() {
      complete();
    }, 600); // grounddb waits 500ms...

  });

  server('Check to see the offline tab change', function(complete) {
    console.log('**** SERVER - Check offline data created by B and send by A');
    var item = db.findOne({ test: 1 });

    if (item) {
      complete();
    } else {
      complete('Could not find the added document');
    }
  });  

});