// pass.js
var bcrypt = require('bcryptjs');

module.exports = function(pwd, hash) {
  try {
    if (hash) {
      return bcrypt.compareSync(pwd, hash);
    } else {
      var salt = bcrypt.genSaltSync(3);
      var hash = bcrypt.hashSync(pwd, salt);

      return {
        salt: salt,
        hash: hash
      };
    }
  } catch (ex) {
    console.log('bcypyt Error-' + ex);
  }
}