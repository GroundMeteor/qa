TestUtils = {};

TestUtils.clearDatabase = function(server /* clients */) {
  server('Empty database', function(complete) {
    GroundTest.log('CLEAR DB');  
    db.remove({});
    
    Meteor.setTimeout(function() {
      complete();
    }, 600);
  }); 

  for (var i = 0; i < arguments.length; i++) {
    var client = arguments[i];

    client('Check empty database', function(complete) {
      var count = db.find().count();

      if (count == 0) {
        complete();
      } else {
        complete('Database not empty found ' + count + ' documents');
      }
    });
    
  }   
};

TestUtils.sameStep = function(name, testFunction /* Clients */) {
  for (var i = 2; i < arguments.length; i++) {
    var client = arguments[i];

    client(name, testFunction);
  }
};