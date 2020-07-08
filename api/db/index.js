const s = require('./../settings');
const {Pool, types} = require('pg');
const redis = require('redis');
const { promisify } = require("util");
/*
 * custom type parsing
 */
types.setTypeParser(1700, function(val) {
  return parseFloat(val);
});
types.setTypeParser(20, function(value) {
  return parseInt(value);
});

var pgWrite = new Pool({
  host: s.db.host,
  user: s.db.write.user,
  database: s.db.name,
  password: s.db.write.password,
  port: s.db.port,
  max: s.db.poolMax
});
exports.pgWrite = pgWrite;

pgWrite.on('error', (err) => {
  console.error('Unexpected error on postgres client write', err);
  process.exit(-1);
});

var pgRead = new Pool({
  host: s.db.host,
  user: s.db.read.user,
  database: s.db.name,
  password: s.db.read.password,
  port: s.db.port,
  statement_timeout: 30 * 1000,
  max: s.db.poolMax
});
exports.pgRead = pgRead;

pgRead.on('error', (err) => {
  console.error('Unexpected error on postgres client read', err);
  process.exit(-1);
});

var pgCustom = new Pool({
  host: s.db.host,
  user: s.db.custom.user,
  database: s.db.name,
  password: s.db.custom.password,
  port: s.db.port,
  statement_timeout: 30 * 1000,
  max: s.db.poolMax
});
exports.pgCustom = pgCustom;

pgCustom.on('error', (err) => {
  console.error('Unexpected error on postgres client custom', err);
  process.exit(-1);
});

var clientRedis = redis.createClient({
  url: 'redis://' + s.redis.host + ':' + s.redis.port
});

clientRedis.on('error', (err) => {
  console.error('Unexpected error on redis client', err);
  process.exit(-1);
});

exports.clientRedis = clientRedis;
exports.redisGet = promisify(clientRedis.get).bind(clientRedis); 
exports.redisSet = promisify(clientRedis.set).bind(clientRedis); 

