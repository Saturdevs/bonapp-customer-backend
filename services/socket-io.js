const rooms = require('../shared/enums/socketRooms');
const sio = require('socket.io');
const OrderDAO = require('../dataAccess/order');
const OrderStatus = require('../shared/enums/orderStatus');

function initialize(server){
    var io = sio.listen(server);
    io.on("connection", socket => { //se ejecuta cada vez que un usuario se conecta al socket
        // console.log('a new user just connected!! ');
        socket.on("webSystemConnection", connection => { // escucha el metodo webSystemConnection, que lo mando desde el sistema web para asignarlo a la room WEBSYSTEM 
            socket.join(rooms.WEBSYSTEM); // asigno el sistema web a la room websystem para poder despues comunicarme con el mismo
        });

        socket.on("appUserConnection", async (appUserData) => { // escucha el metodo appUserConnection appUser tiene el NroMesa y el UserID 
            const order = await OrderDAO.getOrderById(appUserData.orderId);
            let user = order.users.find(x => x.username === appUserData.username);
            if(user){
                user.socketId = socket.id;
                await OrderDAO.update(order);
            };      
        });
    
        socket.on("callWaiter", waiterCall => { //escucha el metodo de llamar al mozo, que lo llamo desde la app
            socket.to(rooms.WEBSYSTEM).emit('callWaiter', waiterCall); //le emito al sistema web que alguien llamo al mozo
            // si queremos que tambien le mande al mozo, solamente hay que emitirle al mozo el mismo mensaje
        });

        socket.on("updateTable", updateTable => { //escucha el metodo de actualizar las mesas
            socket.to(rooms.WEBSYSTEM).emit('updateTable', updateTable); //le emito al sistema web que tiene que actualizar las mesas
        });

        socket.on("acceptOrder", async (acceptedOrder) => { //escucha el metodo de orden aceptada
            const order = await OrderDAO.getOrderById(acceptedOrder.orderId);
            let user = order.user.find(x => x.username === acceptedOrder.username);
            if(user){
                socket.to(user.socketId).emit('orderAccepted', {}); //le emito a la app que se acepto la orden
            };
        });
    });
}



module.exports = {
    initialize
}