/*

This file initializes the databases and the test environment

*/

if (Meteor.isServer) {
  
  // Empty users collection
  Meteor.users.remove({});

  // Create test users
  _.each(['a', 'b', 'c', 'd'], function(name) {

    Accounts.createUser({
      username: name,
      email: name + '@test.foo',
      password: '1234',
      profile: {}
    });

  });

  var countTestUsers = Meteor.users.find().count();
  console.log('Created', countTestUsers, 'test users');

  db = new Meteor.Collection('test');

  db.remove({});

  db.find().observe({
    'added': function(doc) {
      console.log('added', doc);
    },
    'changed': function(doc, olddoc) {
      console.log('changed', doc, olddoc);
    },
    'removed': function(doc) {
      console.log('removed', doc);
    },
  });

  var allowAll = {
    insert: function (userId, doc) {
      // the user must be logged in
      return true;
    },
    update: function (userId, doc, fields, modifier) {
      // the user must be logged in
      return true;
    },
    remove: function (userId, doc) {
      // the user must be logged in
      return true;
    } 
  };

  db.allow(allowAll);

} else {

}

GroundTest.add('Test environment', function() {

  // Insert iframe 
  var clientA = new this.Client('A');
  var clientB = new this.Client('B');
  var clientC = new this.Client('C');

  var server = new this.Server();


  /*

    We rig the db collection to be used on the server - we dont want to rig this
    multiple times since we are on one server instance througout the test

  */
  server('Test server environment', function(complete) {
    console.log('---------------- TEST 0 - START --------------');
    
    if (typeof db !== 'undefined') {
      if (db instanceof Meteor.Collection) {
        complete();
      } else {
        complete('could not set db as instance of Meteor.Collection');
      }
    } else {
      complete('db variable not set');
    }
  });


  /*

    Do some simple tests of the Ground object / global

  */
  clientA('Test client environment - new Ground.Collection', function(complete) {

    if (typeof Ground.Collection !== 'function') {

      complete('Global "Ground.Collection" not a function "' + (typeof Ground.Collection) + '"');

    } else {

      db = new Ground.Collection('test');

      if (typeof db !== 'undefined') {
        if (db instanceof Meteor.Collection) {
          complete();
        } else {
          complete('could not set db as instance of Meteor.Collection');
        }
      } else {
        complete('db variable not set');
      }

    }
  });

  clientB('Test client environment - new Meteor.Collection', function(complete) {

    if (typeof Meteor.Collection !== 'function') {

      complete('Global "Meteor.Collection" not a function "' + (typeof Meteor.Collection) + '"');

    } else {

      dbFoo = new Meteor.Collection('test');

      try {
        db = new Ground.Collection(dbFoo);
        complete();
      } catch(err) {
        complete('Ground.Collection fails to use Meteor.Collection');
      }

    }
  });

  clientC('Test client environment - new Mongo.Collection', function(complete) {

    if (typeof Mongo.Collection !== 'function') {

      complete('Global "Mongo.Collection" not a function "' + (typeof Mongo.Collection) + '"');

    } else {

      dbFoo = new Mongo.Collection('test');

      try {
        db = new Ground.Collection(dbFoo);
        complete();
      } catch(err) {
        complete('Ground.Collection fails to use Mongo.Collection');
      }

    }
  });

});