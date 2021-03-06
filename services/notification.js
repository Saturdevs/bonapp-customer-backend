'use strict'

const Suscription = require('../models/subscription');
const NotificationDAO = require('../dataAccess/notification');
const config = require('../config');
const webpush = require('web-push');


/**
 * @description Crea una nueva suscription y la guarda en la db.
 * @param {JSON} reqBody request body.
 * @returns suscription guardada en la base de datos.
 */
async function saveSuscription(reqBody) {
  let suscriptionSaved = await NotificationDAO.saveSuscription(reqBody);
  return suscriptionSaved;
}

async function saveNotification(reqBody) {
  let notificationSaved = await NotificationDAO.saveNotification(reqBody);
  return notificationSaved;
}

async function updateNotification(notificationId, reqBody) {
  let notificationSaved = await NotificationDAO.updateNotification(notificationId, reqBody);
  return notificationSaved;
}

async function getSubscriptions() {
  let subscriptions = await NotificationDAO.getSuscriptions();
  return subscriptions
}

async function getTypes() {
  let notificationTypes = await NotificationDAO.getTypes();
  return notificationTypes
}

async function getNonReadNotifications() {
  let notifications = await NotificationDAO.getNonReadNotifications();
  return notifications
}

async function resendNotifications() {
  let nonReadNotifications = await NotificationDAO.getNonReadNotifications();
  if (nonReadNotifications !== undefined && nonReadNotifications !== null) {
    nonReadNotifications.forEach(async (notification) => {
      const allSubscriptions = await NotificationService.getSubscriptions();
      //make notification to send
      allSubscriptions.forEach(async (subscription) => {
        await sendNotification(subscription, notification);
      })
    });
  }
}

async function sendNotification(subscription, notificationPayload) {
  webpush.setVapidDetails(
    'mailto:imchiodo1@gmail.com', //ver
    config.VAPID_PUBLIC_KEY,
    config.VAPID_PRIVATE_KEY
  );
  return webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
}

/**
 * @description Elimina la subscription de notificaciones con id igual al dado como parametro de la base de datos.
 * @param {String} subscriptionId id de la subsctiption que se quiere eliminar
 */
async function deleteSubscription(subscriptionId) {
  try {
    let subscription = await NotificationDAO.getSubscriptionById(subscriptionId);
    await NotificationDAO.remove(subscription);
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  saveSuscription,
  getSubscriptions,
  sendNotification,
  saveNotification,
  getTypes,
  resendNotifications,
  getNonReadNotifications,
  updateNotification,
  deleteSubscription
}