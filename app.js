'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const categoryRouter = require('./routes/categoryRoutes')
const productRouter = require('./routes/productRoutes')
const orderRouter = require('./routes/orderRoutes')
const menuRouter = require('./routes/menuRoutes')
const userRouter = require('./routes/userRoutes')
const paymentTypeRouter = require('./routes/paymentTypeRoutes')
const sizeRouter = require('./routes/sizeRoutes')
const sectionRouter = require('./routes/sectionRoutes')
const tableRouter = require('./routes/tableRoutes')
const fileRouter = require('./routes/fileRoutes')
const cashRegisterRouter = require('./routes/cashRegister')
const cashFlowRouter = require('./routes/cashFlow')
const arqueoCajaRouter = require('./routes/arqueoCaja')
const clientRouter = require('./routes/clientRoutes')
const supplierRouter = require('./routes/supplierRoutes')
const transactionRouter = require('./routes/transactionRoutes')
const mercadoPagoRouter = require('./routes/mercadoPagoRoutes')
const dailyMenuRouter = require('./routes/dailyMenuRoutes')
const userRoleRouter = require('./routes/userRoleRoutes')
const generatorRouter = require('./routes/qrGenerator')
const paramRouter = require('./routes/paramRoutes')
const settingsRouter = require('./routes/settingsRoutes')
const notificationRouter = require('./routes/notification')

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))
app.use(bodyParser.json({limit: '50mb'}))
app.use(function (req, res, next) {
res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
res.setHeader('Access-Control-Allow-Credentials', true);
res.header('access-Control-Allow-Origin', '*');
next();
});

app.use('/api/category', categoryRouter)
app.use('/api/product', productRouter)
app.use('/api/order', orderRouter)
app.use('/api/menu', menuRouter)
app.use('/api/user', userRouter)
app.use('/api/paymentType', paymentTypeRouter)
app.use('/api/size', sizeRouter)
app.use('/api/section', sectionRouter)
app.use('/api/table', tableRouter)
app.use('/api/cashRegister', cashRegisterRouter)
app.use('/api/cashFlow', cashFlowRouter)
app.use('/api/arqueo', arqueoCajaRouter)
app.use('/api/client', clientRouter)
app.use('/api/file',fileRouter)
app.use('/api/supplier', supplierRouter)
app.use('/api/transaction', transactionRouter)
app.use('/api/mercadoPago', mercadoPagoRouter)
app.use('/api/dailyMenu',dailyMenuRouter)
app.use('/api/userRole', userRoleRouter)
app.use('/api/qrGenerator',generatorRouter)
app.use('/api/notification',notificationRouter)
app.use('/api/param', paramRouter)
app.use('/api/settings', settingsRouter)

//Middleware to handle error
app.use(function errorHandler(err, req, res, next) {
  if(err.name === 'ValidationError'){
    return res.status(422).send({
      errors: Object.keys(err.errors).reduce(function(errors, key){
        errors[key] = err.errors[key].message;

        return errors;
      }, {})
    })
  }

  return next(err);
})

module.exports = app