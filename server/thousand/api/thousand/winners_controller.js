'use strict';

var winners = [];

module.exports = exports = {
  saveWinners: function(req, res, next) {
    console.log('Winners', req.body);
    winners = req.body;
    res.send('ok');
  },
  listWinners: function(req, res, next) {
    res.write('<html><body><h3>Winners</h3><ul>');
    winners.forEach(function(winner) {
      var values = [winner.name, winner.cuid, winner.submissionId, winner.url];
      res.write('<li>' + values.join(', ') + '</li>');
    })
    res.write('</ul></body></html>');
    res.end();
  }
};
