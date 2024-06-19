import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';

// Create a Bull queue named userQueue
const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    const userCollection = dbClient.client.db().collection('users');
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    } else if (!password) {
      res.status(400).json({ error: 'Missing password' });
    } else {
      const user = await userCollection.findOne({ email });
      if (user) res.status(400).json({ error: 'Already exist' });
      else {
        const result = await userCollection.insertOne({ email, password: sha1(password) });
        const userId = result.insertedId;
        // Add job to userQueue to send welcome email
        await userQueue.add({ userId });
        res.status(201).json({ id: userId, email });
      }
    }
  }
}

export default UsersController;
