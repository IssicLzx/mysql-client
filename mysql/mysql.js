var async = require('async');
// mysql CRUD
var sqlclient = module.exports;

var _pool;

var NND = {};

/*
 * Init sql connection pool
 * @param {Object} app The app for the server.
 */
NND.init = function(app){
    _pool = require('./mysql-pool').createMysqlPool(app);
};

/**
 * Excute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 * @param {fuction} cb Callback function.
 *
 */
NND.query = function(sql, args, cb){
    _pool.acquire(function(err, client) {
        if (!!err) {
            console.error('[sqlqueryErr] '+err.stack);
            return;
        }
        client.query(sql, args, function(err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });
};

NND.transaction = function(func , callback){
    _pool.acquire(function(err, client) {
        if (!!err) {
            console.error('[sqlqueryErr] '+err.stack);
            return;
        }
        var result;
        async.waterfall([
            function(cb){
                client.beginTransaction(cb);
            },
            function(res, undefined,cb){
                func( client , cb);
            },
            function(res, cb){
                result = res;
                client.commit(cb);
            },
            function(cb){
                _pool.release(client);
                callback(null, result);
            }
        ],function(err, res){
            client.rollback(function(err) {
                if (err){
                    console.log('rollback err: ', err);
                }
                _pool.release(client);
            });
            callback(new Error('query error'), null);
        });

    });
}
/**
 * Close connection pool.
 */
NND.shutdown = function(){
    _pool.destroyAllNow();
};

/**
 * init database
 */
sqlclient.init = function(app) {
    if (!!_pool){
        return sqlclient;
    } else {
        NND.init(app);
        sqlclient.insert = NND.query;
        sqlclient.update = NND.query;
        sqlclient.delete = NND.query;
        sqlclient.query = NND.query;
        sqlclient.transaction = NND.transaction;
        return sqlclient;
    }
};

/**
 * shutdown database
 */
sqlclient.shutdown = function(app) {
    NND.shutdown(app);
};


