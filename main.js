document.getElementById('run').onclick = function () {
  var streams;
  var start = new Date();
  var result = Interpreter.run(document.getElementById('code').value, streams = {});
  var time = new Date() - start;
  var html = '';

  if (streams.error) {
    html = '<div class="error">' + streams.error + '</div>';
  } else {
    if (streams.output) {
      html += '<div>' + streams.output + '</div>';
    }

    html += '<div>' + '=> ' + result + '</div>';
  }

  html += '<div class="time">Elapsed time: ' + time + 'ms</div>';

  document.getElementById('result').innerHTML = html;
};