import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}/${database}`;

    this.connected = false;

    this.client = MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.client.connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => {
        console.error(`Failed to connect to MongoDB: ${err.message}`);
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const user = await this.client.db().collection('users').countDocuments();
    return user;
  }

  async nbFiles() {
    const file = await this.client.db().collection('files').countDocuments();
    return file;
  }
}

const dbClient = new DBClient();
export default dbClient;
