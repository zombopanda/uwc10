Interpreter = function () {
  var isInt = function (value) {
    return !isNaN(value) && value == parseInt(value);
  };

  var isFloat = function (value) {
    return !isNaN(value) && value == parseFloat(value);
  };
  
  var isNumber = function (value) {
    return isInt(value) || isFloat(value);
  };

  var castType = function (value) {
    if (isFloat(value)) {
      return parseFloat(parseFloat(value).toFixed(2));
    }

    if (isInt(value)) {
      return parseInt(value);
    }

    if (value === 'true' || value === 'false') {
      return value === 'true';
    }

    return value;
  };

  var RuntimeError = function (message) {
    this.message = message;
  };

  var Parser = function (code) {
    var chars = code.split('');
    var tree = {
      chars: chars
    };

    var pushElement = function (node, start, end, type) {
      if (!node.elements) {
        node.elements = [];
      }

      var el = {
        start: start,
        end: end,
        content: castType(chars.slice(start, end).join(''))
      };

      if (type) {
        el.type = type;
      } else {
        if (isNumber(el.content)) {
          el.type = 'number';
        }
      }

      node.elements.push(el);
      return el;
    };

    var parse = function(element) {
      var startStatement = (element && element.start) || 0,
          endStatement = (element && element.end) || code.length,
          node = element || tree,
          openBrackets = 0,
          startBracket = 0,
          parseStart = 0,
          parseStatement = false,
          openQuote = false,
          startQuote = 0;

      for (var i = startStatement; i < endStatement; i++) {
        switch (chars[i]) {
          case '(':
            if (openBrackets == 0) {
              startBracket = i + 1;
            }

            openBrackets++;
            break;
          case ')':
            openBrackets--;

            if (openBrackets == 0) {
              parse(pushElement(node, startBracket, i));
            }

            break;
        }

        if (openBrackets != 0) {
          continue;
        }

        switch (chars[i]) {
          case '"':
            if (!openQuote) {
              openQuote = true;
              startQuote = i + 1;
            } else {
              openQuote = false;
              pushElement(node, startQuote, i, 'string');
            }
            break;
          case ")":
          case " ":
          case "\n":
          case "\t":
            if (parseStatement && !openQuote) {
              pushElement(node, parseStart, i);
            }

            parseStatement = false;
            break;
          default:
            if (!parseStatement && !openQuote) {
              parseStatement = true;
              parseStart = i;
            }
        }

        if (i == endStatement - 1 && parseStatement && !openQuote) {
          pushElement(node, parseStart, endStatement);
        }
      }

      if (openBrackets != 0) {
        throw new SyntaxError('Syntax error');
      }

      return tree;
    };

    return {
      parse: parse
    }
  };

  var Executor = function (tree, streams) {
    streams = streams || {};
    streams.output = '';

    var functions = {};

    var print = function (string) {
      streams.output += string;
    };

    var makeArguments = function(parameters, operands, args) {
      var newArgs = {};
      for (var j = 0; j < parameters.length; j++) {
        newArgs[parameters[j]] = exec(operands[j], args);
      }

      return newArgs;
    };

    var exec = function (node, args) {
      var elements = node.elements;
      var content = node.content;

      if (!elements) {
        if (node.type != 'number' && node.type != 'string') {
          if (args && typeof args[content] !== 'undefined') {
            return args[content];
          } else {
            throw new RuntimeError('Undefined variable ' + content)
          }
        }

        return content;
      }

      if (elements.length == 1) {
        return elements[0].content;
      }

      var operator = elements[0];
      var operands = elements.slice(1);
      var result, j;

      switch (operator.content) {
        case '+':
          result = 0;
          for (j = 0; j < operands.length; j++) {
            result += exec(operands[j], args);
          }
          break;
        case '-':
          result = exec(operands[0], args);
          for (j = 0; j < operands.length; j++) {
            if (j > 0) {
              result -= exec(operands[j], args);
            }
          }
          break;
        case '*':
          result = 1;
          for (j = 0; j < operands.length; j++) {
            result *= exec(operands[j], args);
          }
          break;
        case '/':
          result = exec(operands[0], args);
          for (j = 0; j < operands.length; j++) {
            if (j > 0) {
              result /= exec(operands[j], args);
            }
          }
          break;
        case 'sqrt':
          result = Math.sqrt(exec(operands[0], args));
          break;
        case 'if':
          result = exec(operands[0], args)
              ? exec(operands[1], args)
              : exec(operands[2], args);
          break;
        case 'print':
          for (j = 0; j < operands.length; j++) {
            print(exec(operands[j], args));
          }
          break;
        case '=':
          result = true;
          var first = exec(operands[0], args);
          for (j = 0; j < operands.length; j++) {
            result = !!(result && first == exec(operands[j], args));
          }

          break;
        case 'define':
          var name = operands[0].elements[0].content;
          var parameters = operands[0].elements.slice(1).map(function (node) {
            return node.content;
          });
          functions[name] = {
            name: name,
            parameters: parameters,
            body: operands[1]
          };

          break;
        default:
          var fn = functions[operator.content];

          if (fn) {
            result = exec(fn.body, makeArguments(fn.parameters, operands, args));
          } else {
            throw new RuntimeError('Undefined operator ' + operator.content);
          }
      }

      return castType(result);
    };

    exec = function (execOriginal) {
      var cache = {};

      return function(node, args) {
        var key = '' + node.content + JSON.stringify(args);

        if (cache[key]) {
          return cache[key];
        }

        return cache[key] = execOriginal(node, args);
      }
    }(exec);

    var execute = function () {
      var result;

      if (tree.elements && tree.elements.length) {
        for (var i = 0; i < tree.elements.length; i++) {
          result = exec(tree.elements[i]);
        }
      }

      return result;
    };

    return {
      execute: execute
    };
  };

  var run = function (code, streams) {
    if (!streams) {
      streams = {};
    }

    try {
      var tree = Parser(code).parse();
      return Executor(tree, streams).execute();
    } catch (error) {
      streams.error = error.message;
    }
  };

  return {
    run: run
  }
}();
