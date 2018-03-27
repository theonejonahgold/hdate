const mongo = require('mongodb')
const url = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}`
let _db
module.exports = {
    connect: callback =>
        mongo.MongoClient.connect(url, (err, client) => {
            console.log(url)
            err && console.error(err)
            _db = client.db(process.env.DB_NAME)
            callback(err)
        }),
    getInstance: () => _db
}