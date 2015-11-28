
var db_client = require('./mysql/mysql');

var app = {};

db_client.init(app);

var sql = 'select * from user where id = ?';
var args = [1];

db_client.query(sql, args, function(err, res){

    if (err) {
        console.log(err);
    }

    console.log(res);

});