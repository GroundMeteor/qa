// 1. Test bed runs initializes clients and counts expected steps
// 2. clients are up and running, they report ready
// 3. when all clients are ready testbed will start step 0
// 4. a step will run in one client
// 5. the client repports back with string '' = ok or an error message
// 6. testbed will display the errors and passes
// 7. the test bed will set next step and repeat until all steps have been run.
// 8. the test bed will clean up clients and remove them from dom.
// 9. the test bed will start next test.

if (Meteor.isServer) {
  db = new Meteor.Collection('test');
}

if (Meteor.isClient) {
  localStorage.clear();
}

GroundTest.add('Inserts', function() {

  // Insert iframe 
  var clientA = new this.Client('A');
  var clientB = new this.Client('B');

  // Use this server
  var server = new this.Server();

  // Step 0
  server(function(complete) {
    // Empty test db
    db.remove();

    complete(); 
  });

  // Step 1
  clientA(function(complete) {
    db = new GroundDB('test');

    db.find({}).forEach(function(doc) {
      db.remove({ _id: doc._id });
    });

    db.insert({ foo: 'bar' }, function(err) {
      complete();
    });
  });

  // step 2
  clientB(function(complete) {
    db = new GroundDB('test');

    var item = db.findOne({});

    Meteor.disconnect();

    if (!item || item.foo !== 'bar')
      complete('Could not find item with foo==bar')
    else
      complete();

  });

  // Step 3
  clientA(function(complete) {

    var item = db.findOne({});

    db.update({ _id: item._id }, { foo: 'foo' }, function(err) {
      Meteor.setTimeout(function() {
        complete();
      }, 1000);
    });

  });


  // step 4
  clientB(function(complete) {
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

});