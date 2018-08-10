$(function () {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  $('.js-draw').click(function () {
    $.get('/map')
      .done(function (res) {
        var map = JSON.parse(res.mapData);

        for (var i in map) {
          context.fillStyle = map[i].color;
          context.fillRect(map[i].coordinate[0] + 2000, map[i].coordinate[1] + 2000, 1, 1);
        }
      })
      .fail(function (err) {
        console.error(err);
        $('.js-error-message').text(err.statusText);
      });
  });
});
