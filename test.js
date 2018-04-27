var expect = chai.expect;

describe('UWC Interpreter', function() {
  it('should print errors', function () {
    var streams;

    expect(Interpreter.run('(x 123', streams = {})).to.be.equal(undefined);
    expect(streams.error).to.be.equal('Syntax error');

    expect(Interpreter.run('(+ (abc 100) 10)', streams = {})).to.be.equal(undefined);
    expect(streams.error).to.be.equal('Undefined operator abc');
  });

  it('should perform arithmetic operations', function () {
    expect(Interpreter.run('(* (+ 1 2) (+ 2 2))')).to.be.equal(12);

    expect(Interpreter.run(' (  +  1  2)')).to.be.equal(3);
    expect(Interpreter.run('(- 10   3 2) ')).to.be.equal(5);

    expect(Interpreter.run('(- 5.2 1 0.3) ')).to.be.equal(3.9);

    expect(Interpreter.run('(+ 1 2)')).to.be.equal(3);
    expect(Interpreter.run('(- 10 3 2)')).to.be.equal(5);

    expect(Interpreter.run('(* 5 6)')).to.be.equal(30);
    expect(Interpreter.run('(/ 20 2)')).to.be.equal(10);

    expect(Interpreter.run('(+ 2 3 (+ 1 2 (+ 5 6)) 4)')).to.be.equal(23);
    expect(Interpreter.run('( + 2  3 (+  1 2 ( +  5 6) ) 5)')).to.be.equal(24);

    expect(Interpreter.run('(+ 1 2 4 (- 2 1))')).to.be.equal(8);
    expect(Interpreter.run('(+ 3 (* 4 5))')).to.be.equal(23);
    expect(Interpreter.run('(- 45 (+ 4 5))')).to.be.equal(36);
    expect(Interpreter.run('(/ 100 (- 1 (+ 7 (+ 10 9))))')).to.be.equal(-4);
    expect(Interpreter.run('(* 10 (+ 3 2 7 (/ 6 2) ))')).to.be.equal(150);

    expect(Interpreter.run('(+ (sqrt 100) 10)')).to.be.equal(20);
  });

  it('should have conditional statement and print operator', function () {
    var streams;
    expect(Interpreter.run('(= (sqrt 100) 10)')).to.be.equal(true);

    Interpreter.run('(if (= (sqrt 100) 10 (+ 5 5)) (print "should be 10") (print "error"))', streams = {});
    expect(streams.output).to.be.equal('should be 10');
  });

  it('should define and run recursive functions', function () {
    var streams;

    expect(Interpreter.run('(define (fn z) (+ 1 x)) (fn 1)', streams = {})).to.be.equal(undefined);
    expect(streams.error).to.be.equal('Undefined variable x');

    expect(Interpreter.run('(define (fn b a c) (+ a c (* 2 b))) (fn 3 2 3)')).to.be.equal(11);
    expect(Interpreter.run('(define (fib n) (if (= n 0) (0) (if (= n 1) (1) (+ (fib (- n 1)) (fib (- n 2)))))) (fib 50)')).to.be.equal(12586269025);
  });
});
