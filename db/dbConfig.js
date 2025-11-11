const {MongoClient} = require('mongodb');


//return instance of MongoClient
async function connectToDB(url) {
    return await MongoClient.connect(url);
}

module.exports = connectToDB;