GroundTest.add('test2', function() {

  var clientA = new this.Client('A');

  clientA(function(complete) {
    complete('Hello from test 2 :)');
  });
});