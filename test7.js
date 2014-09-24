/*

Test how clients behave when offline and server makes changes, are they
behaving when coming back online?


*/

GroundTest.add('Does offline clients behave on server updates', function() {

  var clientA = new this.Client('A');
  var clientB = new this.Client('B');

  var server = new this.Server();

////////////////////////////////////////////////////////////////////////////////


  TestUtils.sameStep('Init', function(complete) {
    db = new GroundDB('test');

    complete();
  }, clientA, clientB);

  TestUtils.clearDatabase(server, clientA, clientB);

  TestUtils.sameStep('Disconnect', function(complete) {
    Meteor.disconnect();
    complete();
  }, clientA, clientB);

  // Step 9
  server('Add data', function(complete) {

    db.insert({ test: 7, foo: 'bar1' });
    db.insert({ test: 7, foo: 'bar2' });
    db.insert({ test: 7, foo: 'bar3' });
    db.insert({ test: 7, foo: 'bar4' });
    
    complete();
  }); 

  clientA('Reconnect', function(complete) {
    Meteor.reconnect();
    complete();
  });    

  clientB('Reconnect, and wait 500ms', function(complete) {
    Meteor.reconnect();
    Meteor.setTimeout(function() {
      complete();
    }, 500);
  });

  TestUtils.sameStep('Test db', function(complete) {
    var count = db.find().count();

    if (count == 4) {
      complete();
    } else {
      complete('Data does not match ' + count);
    }
  }, clientA, clientB, server);

});