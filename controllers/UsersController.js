import sha1 from 'sha1';
import dbClient from '../utils/db';

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
        res.status(201).json({ id: result.insertedId, email });
      }
    }
  }
}

export default UsersController;
