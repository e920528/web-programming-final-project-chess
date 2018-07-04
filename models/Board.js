var mongoose = require('mongoose');

var BoardSchema = new mongoose.Schema({
    board: [[Number]],
    blackIsNext: Boolean
  });

module.exports = mongoose.model('Board', BoardSchema);
