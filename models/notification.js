'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('../models/user');
const NotificationType = require('../models/notificationType');
const NotificationTypesEnum = require('../shared/enums/notificationTypes');

const notificationSchema = Schema({
  //Tipo de la notificacion.
  notificationType: {
    type: String,
    enum: [NotificationTypesEnum.TABLE_TAKEN, NotificationTypesEnum.NEW_ORDER, NotificationTypesEnum.CALL_WAITER],
    ref: NotificationType,
    required: true
  },
  //Mesa desde la que se envio la notificacion. Puede ser null.
  table: {
    type: Number
  },
  //Usuario que mando la notificacion. Puede ser null.
  userFrom: {
    type: Schema.Types.ObjectId,
    ref: User
  },
  //Usuarios a los que se manda la notificacion.
  usersTo: [{ 
    userId: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
      unique: true
    }
  }],
  //Fecha y hora en la que se creo la notificacion.
  createdAt: {
    type: Date,
    required: true
  },
  //Fecha y hora en la que se leyo la notificacion.
  readBy: [{ 
    readId: { type: Schema.Types.ObjectId, ref: User, required: true, unique: true },
    readAt: { type: Date, required: true }
  }]
});

module.exports = mongoose.model('Notification', notificationSchema);