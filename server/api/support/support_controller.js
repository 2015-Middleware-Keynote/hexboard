'use strict';

module.exports = exports = {
  receiveFeedback: function(req, res, next) {
    console.log(req.body);
    res.send('Thanks-you for your feedback!');
  }
}
