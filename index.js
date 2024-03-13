const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const mongoURI = 'mongodb://192.168.1.29:60000/practiceDatabase';

// 4 Random tanentId array
const tenantIdArray = [
    '657820728c2c6331acdf80f7',
    '6578209206a16e7d89f1b4da',
    '657af6f53d9b709e320816e6',
    '651d513492bf7f0913c85199'
]

// Define MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Register a shard with the cluster

async function addShardToCluster(shardURI) {
    const client = new MongoClient(mongoURI, mongoOptions);
    
    try {
        await client.connect();
    
        // Add shard to the cluster
        await client.db('admin').command({ addShard: shardURI });
    
        console.log('Shard added to the cluster successfully');
    } catch (error) {
        console.error('Error adding shard to the cluster:', error);
    } finally {
        await client.close();
    }
}

// addShardToCluster('shard4rs/192.168.1.29:50004')


// Setup range based sharding
async function setupRangeBasedSharding(databaseName, collectionName) {
    const client = new MongoClient(mongoURI, mongoOptions);
    
    try {
        await client.connect();
        const database = client.db('admin');
        const practiceDatabase = client.db(databaseName);
        // Enable sharding for the database
        // await database.command({ enableSharding: databaseName });
    
        // Create a shard key index
        await practiceDatabase.collection(collectionName).createIndex({ tenantId: 1 });

        // Shard the collection based on the shard key
        await database.command({ shardCollection: `${databaseName}.${collectionName}`, key: { tenantId: 1 } });

        // Split chunks based on the shard key
        await database.command({ split: `${databaseName}.${collectionName}`, middle: { tenantId: new mongoose.Types.ObjectId(tenantIdArray[0]) } });

        // // // Move chunks to specific shards
        await database.command({ moveChunk: `${databaseName}.${collectionName}`, find: { tenantId: new mongoose.Types.ObjectId(tenantIdArray[0]) }, to: 'shard1rs' });
    
        console.log('Range based sharding configuration completed successfully');
    } catch (error) {
        console.error('Error configuring range based sharding:', error);
    } finally {
        await client.close();
    }

}

setupRangeBasedSharding('practiceDatabase', 'activities');

// Connect to MongoDB using Mongoose
// mongoose
//   .connect(mongoURI, mongoOptions)
//   .then(async () => {
//     console.log('Connected to MongoDB');

//     // Define Mongoose schema for your collection
//     const schema = new mongoose.Schema({
//       tenantId: { type: mongoose.Types.ObjectId, required: true },
//       name: String,
//       // Define other fields as needed
//     });

//     // Create Mongoose model
//     const practiceModal = mongoose.model('practicecollection', schema);
//     const shard1batchData = [
//       {
//         name: 'John 6',
//         tenantId: tenantIdArray[3],
//       },
//       {
//         name: 'Alice 6',
//         tenantId: tenantIdArray[3],
//       },

//       // Add more documents as needed
//     ];


//     // Add batch data to the collection using create method
//     const data = await practiceModal.create(shard1batchData);

//     console.log('practiceModal data 1 ====', data);

//     // Execute administrative commands to configure sharding using the MongoDB Node.js driver

//     // Configure sharding
//     // configureSharding();
//   })
//   .catch((error) => {
//     console.error('Error connecting to MongoDB:', error);
//   });
