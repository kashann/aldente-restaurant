const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
var favicon = require('serve-favicon');

const app = express();
const http = require('http').createServer(app);
var io = require('socket.io').listen(http) ;
app.use(bodyParser.json());
app.use(favicon(__dirname + '/favicon.ico'));

const sequelize = new Sequelize('rest_restaurant','root','', {
  dialect : 'mysql',
  define : {
    timestamps : false
  }
});
 
const Table = sequelize.define('table',{
  table_number : {
    type : Sequelize.INTEGER,
    allowNull : false,
    validate : {
          isNumeric : true,
          isInt : true,
          min : 1,
          max : 999
    }
  },
  waiter : {
    type : Sequelize.INTEGER,
    allowNull : false,
    validate : {
          isNumeric : true,
          isInt : true,
          min : 1,
          max : 999
    }
  },
  status : {
    type : Sequelize.STRING,
    allowNull : false,
    validate : {
      len : [2,40]
    }
  },
  payment : {
    type : Sequelize.STRING,
    allowNull : true,
    validate : {
      len : [3,6]
    }
  },
  total : {
      type : Sequelize.DECIMAL(8,2),
      allowNull : true
  },
  tip : {
      type : Sequelize.DECIMAL(8,2),
      allowNull : true
  }
},{
  underscored : true
});

const Order = sequelize.define('order', {
  name : {
    type : Sequelize.STRING,
    allowNull : false,
    validate : {
      len : [5,400]
    }
  },
  price : {
    type : Sequelize.INTEGER,
    allowNull : false,
    validate : {
          isNumeric : true,
          isInt : true,
          min : 1,
          max : 9999
    }
  },
  quantity : {
    type : Sequelize.INTEGER,
    allowNull : false,
    validate : {
          isNumeric : true,
          isInt : true,
          min : 1,
          max : 999
    }
  },
  observation : {
    type : Sequelize.TEXT,
    allowNull : true,
    validate : {
      len : [0,200]
    }
  },
  served : {
    type : Sequelize.BOOLEAN,
    allowNull : false,
    defaultValue : false,
    set: function(value) {
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    this.setDataValue('served', value);
    }
  },
  ready : {
    type : Sequelize.BOOLEAN,
    allowNull : false,
    defaultValue : false,
    set: function(value) {
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    this.setDataValue('ready', value);
    }
  },
  table : {
    type : Sequelize.INTEGER,
    allowNull : false,
    validate : {
          isNumeric : true,
          isInt : true
    }
  },
});

Table.hasMany(Order);

var conn = 0;

io.sockets.on('connection', function(socket){
    conn++;
    console.log('Connected: %s sockets connected', conn);
    
    socket.on('request', function(data){
      console.log('request')
    })
    
    socket.on('kitchen', function(data){
        Order.findById(data.oid)
          .then((order) => {
            if(order){
              order.update({ready:true}, {fields : ['ready']});
              io.sockets.emit('waiter', {id:data.wid, status:'Ready', table:order.table});
            }
          })
          .catch((err) => {
            console.warn(err);
          });
    });
    
    socket.on('disconnect', function(data){
        conn--;
        console.log('Disconnected: %s sockets connected', conn);
    });
});

io.on('error', function (err) {
    console.log(err);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/kitchen.html');
});

app.get('/create', (req, res, next) => {
  sequelize.sync({force : true})
    .then(() => res.status(201).send('created'))
    .catch((error) => next(error));
});

app.get('/orders', (req, res, next) => {
  Order.findAll()
    .then((orders) => res.status(200).json(orders))
    .catch((error) => next(error));
});

app.get('/tables', (req, res, next) => {
  Table.findAll()
    .then((tables) => res.status(200).json(tables))
    .catch((error) => next(error));
});

app.post('/tables', (req, res, next) => {
  Table.create(req.body)
    .then(() => res.status(201).send('created'))
    .catch((error) => next(error));
});

app.get('/tables/:id', (req, res, next) => {
  Table.findAll({where : {table_number : req.params.id}, include : [Order], query : {raw:true}})
    .then((table) => {
      if (table){
        res.status(200).json(table);
      }
      else{
        res.status(404).send('not found');
      }
    })
    .catch((error) => next(error));
});

app.get('/tables/waiter/:wid', (req, res, next) => {
  Table.findAll({where : {waiter : req.params.wid}, include : [Order], query : {raw:true}})
    .then((table) => {
      if (table){
        res.status(200).json(table);
      }
      else{
        res.status(404).send('not found');
      }
    })
    .catch((error) => next(error));
});

app.put('/tables/:id', (req, res, next) => {
  Table.findOne({where : {table_number : req.params.id}, query : {raw:true}})
    .then((table) => {
      if (table){
        io.sockets.emit('waiter', {id:table.waiter, table:table.table_number, status:req.body.status});
        return Table.update(req.body, {fields : ['table_number', 'waiter', 'status', 'payment', 'total', 'tip'], where : {table_number : req.params.id}, query : {raw:true}});
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then(() => {
      if (!res.headersSent){
        res.status(201).send('modified');
      }
    })
    .catch((error) => next(error));
});

app.delete('/tables/:id', (req, res, next) => {
  Table.findAll({where : {table_number : req.params.id}, query : {raw:true}})
    .then((tables) => {
      if (tables){
        Order.destroy({where : {table_id : req.params.id}});
        return Table.destroy({where : {table_number : req.params.id}});
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then(() => {
      if (!res.headersSent){
        res.status(201).send('removed');
      }
    })
    .catch((error) => next(error));
});

app.get('/tables/:tid/orders', (req, res, next) => {
  Table.findOne({where : {table_number : req.params.tid}, query : {raw:true}})
    .then((table) => {
      if (table){
        return table.getOrders();
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then((orderitems) => {
      if (!res.headersSent){
        res.status(200).json(orderitems); 
      }
    })
    .catch((error) => next(error)); 
});

app.post('/tables/:tid/orders', (req, res, next) => {
  Table.findOne({where : {table_number : req.params.tid}, query : {raw:true}})
    .then((table) => {
      if (table){
        io.sockets.emit('waiter', {id:table.waiter, status:'Ordered', table:table.table_number});
        req.body.forEach((order) => {
          order.table_id = table.id,
          order.table = table.table_number,
          Order.create(order)
            .then(function(m){
              io.sockets.emit('order', {id:m.get('id'), quantity:order.quantity, name:order.name, observation:order.observation, waiter:table.waiter});
            });
        });
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then((order) => {
      if (!res.headersSent){
        res.status(201).send('created');
      }
    })
    .catch((error) => next(error));
});

app.delete('/tables/:tid/orders/', (req, res, next) => {
  Order.findAll({where : {table_id : req.params.tid}, query : {raw:true}})
    .then((orders) => {
      if (orders){
        orders.forEach((order) =>{
          order.destroy();
        });
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then(() => {
      if (!res.headersSent){
        res.status(201).send('removed');
      }
    })
    .catch((error) => next(error));
});

app.get('/tables/:tid/orders/:oid', (req, res, next) => {
  Order.findAll({where : {table : req.params.tid, id : req.params.oid}, query : {raw:true}})
    .then((orders) => {
      if (orders){
        res.status(200).json(orders);
      }
      else{
        res.status(404).send('not found');
      }
    })
    .catch((error) => next(error));
});

app.put('/tables/:tid/orders/:oid', (req, res, next) => {
  Order.findById(req.params.oid)
    .then((order) => {
      if (order){
        order.update(req.body, {fields : ['served']});
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then(() => {
      if (!res.headersSent){
        res.status(201).send('modified');
      }
    })
    .catch((err) => {
      console.warn(err);
      res.status(500).send('some error...');
    });
});

app.delete('/tables/:tid/orders/:oid', (req, res, next) => {
  Order.findOne({where : {table : req.params.tid, id : req.params.oid}, query : {raw:true}})
    .then((order) => {
      if (order){
        return order.destroy();
      }
      else{
        res.status(404).send('not found');
      }
    })
    .then(() => {
      if (!res.headersSent){
        res.status(201).send('removed');
      }
    })
    .catch((error) => next(error));
});

app.use((err, req, res, next) => {
  console.warn(err);
  res.status(500).send('some error');
});

http.listen(8080);