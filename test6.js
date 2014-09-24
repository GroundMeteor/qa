/*

Test conflict resolution offline insert

We start of with an empty database

We set client A and B with each a db on seperate prefixes locally simulating
two seperated clients

Client A creates a document

Client A goes offline and edits the doc

Client B then edits the document

Now A comes online

But what will happen? A's document older than B - The default
behavior in Meteor is that the latest data to hit the server wins, but thats not
fair when speaking offline data. So our default conflict resolution should have
B's document win.


*/

GroundTest.add('Conflict resolution newest doc wins', function() {

  var clientA = new this.Client('A');
  var clientB = new this.Client('B');

  var server = new this.Server();

////////////////////////////////////////////////////////////////////////////////

  // Step 9
  clientA('clear localStorage', function(complete) {
    localStorage.clear();
    complete();
  }); 

  // Step 9
  server('clear collection', function(complete) {
    db.remove();
    complete();
  }); 

  clientA('Client A creates a document', function(complete) {
    db = new GroundDB('test', { prefix: 'mac'});

    db.insert({ foo: 'new doc' }, function() {
      complete();
    });
  });

  clientA('Client A goes offline and edits the doc', function(complete) {
    Meteor.disconnect();

    var item = db.findOne();

    if (!item) {
      complete('Found no document');
      return
    } else {
      db.update({ _id: item._id }, { $set: { foo: 'older document' } });
      complete();
    }
  });

  clientB('Client B then edits the document', function(complete) {
    db = new GroundDB('test', { prefix: 'pc'});

    var item = db.findOne();

    if (!item) {
      complete('Found no document');
      return
    } else {
      db.update({ _id: item._id }, { $set: { foo: 'newest document' } }, function() {
        complete();
      });
    }


  });

  clientA('Now A comes online', function(complete) {

    Meteor.reconnect();

    Tracker.autorun(function() {

      var status = Meteor.status();
      if (status.connected) {
        this.stop();

        // Let things settle
        Meteor.setTimeout(function() {
          complete();
        }, 600);
      }
    });

  });


  server('Check that the newest document wins', function(complete) {
    var item = db.findOne();

    if (item) {
      if (item.foo == 'newest document') {
        complete();
      } else if (item.foo === 'older document') {
        complete('Document contains the older data - new data is overwritten');
      } else {
        complete('Document not updated');
      }
    } else {
      complete('No document found');
    }
  });


////////////////////////////////////////////////////////////////////////////////

});