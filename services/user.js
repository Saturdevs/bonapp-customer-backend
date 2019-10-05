'use strict'
const User = require('../models/user');

//////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////DATA ACCESS METHODS//////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

async function getUserById(userId) {
  try {
    let user = await User.findById(userId);
    return user;
  }
  catch (err) {
    throw new Error(err);
  }
}

module.exports = {
  getUserById
}