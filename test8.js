/*

Test data types - We want to check ejson types

*/

GroundTest.add('Check types', function() {

  var clientA = new this.Client('A');
  var clientB = new this.Client('B');

  var server = new this.Server();

////////////////////////////////////////////////////////////////////////////////


  TestUtils.sameStep('Init', function(complete) {
    db = new Ground.Collection('test');

    complete();
  }, clientA, clientB);

  TestUtils.clearDatabase(server, clientA, clientB);


  var checkTypes = function(doc) {
    if (!doc) return 'No document found';
    if (doc.numbers[0] !== -1) return 'Failed number -1, got: ' + doc.numbers[0];
    if (doc.numbers[1] !== 0) return 'Failed number 0, got: ' + doc.numbers[1];
    if (doc.numbers[2] !== 1) return 'Failed number 1, got: ' + doc.numbers[2];
    if (doc.numbers[3] !== 1.1) return 'Failed number 1.1, got: ' + doc.numbers[3];
    if (doc.numbers[4] !== -1.1) return 'Failed number -1.1, got: ' + doc.numbers[4];

    if (doc.strings[0] !== '') return 'Failed string "", got: ' + doc.strings[0];
    if (doc.strings[1] !== 'foo') return 'Failed string "foo", got: ' + doc.strings[1];

    if (!(doc.date instanceof Date)) return 'Failed Date, got: ' + doc.date;

    //if (doc.bool[0] !== true) return 'Failed boolean true, got: ' + doc.bool[0];
    if (doc.bool[1] !== false) return 'Failed boolean false, got: ' + doc.bool[1];

    if (doc.undef[0] !== undefined) {
      // undefined is converted into null in EJSON/JSON
      if (doc.undef[0] !== null) return 'Failed undefined, got: ' + doc.undef[0]; 
    }
    if (doc.undef[1] !== null) return 'Failed null, got: ' + doc.undef[1];
  };

  clientA('rig data types', function(complete) {

    db.insert({
      numbers: [-1, 0, 1, 1.1, -1.1],
      strings: ['', 'foo'],
      date: new Date(),
      bool: [true, false],
      undef: [undefined, null]
    });

    Meteor.setTimeout(complete, 2000);

  });


  TestUtils.sameStep('Test types', function(complete) {
    var item = db.findOne();
    complete(checkTypes(item));
  }, clientA, clientB, server);

});