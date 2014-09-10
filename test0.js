/*

This file initializes the databases and the test environment

*/

if (Meteor.isServer) {
  db = new Meteor.Collection('test');
}

GroundTest.add('Test environment', function() {

  // Insert iframe 
  var client = new this.Client('C');

  var server = new this.Server();


  /*

    We rig the db collection to be used on the server - we dont want to rig this
    multiple times since we are on one server instance througout the test

  */
  server('Test server environment', function(complete) {

    
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

    Do some simple tests of the GroundDB object / global

  */
  client('Test client environment', function(complete) {
    if (typeof GroundDB !== 'function') {

      complete('Global "GroundDB" not a function "' + (typeof GroundDB) + '"');

    } else {

      db = new GroundDB('test');

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

});