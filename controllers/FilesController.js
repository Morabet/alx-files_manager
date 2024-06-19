import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userCollection = dbClient.client.db().collection('users');
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    const fileCollection = dbClient.client.db().collection('files');

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parentDocument = null;
    if (parentId !== 0) {
      parentDocument = await fileCollection.findOne({ _id: new ObjectId(parentId) });
      if (!parentDocument) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentDocument.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    const fileDocument = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };
    if (type === 'folder') {
      const result = await fileCollection.insertOne(fileDocument);
      return res.status(201).json({
        id: result.insertedId, userId, name, type, isPublic, parentId,
      });
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const fileName = uuidv4();
    const localPath = path.join(folderPath, fileName);
    const clearData = Buffer.from(data, 'base64').toString('utf-8');
    fs.writeFileSync(localPath, clearData);

    fileDocument.localPath = localPath;
    const result = await fileCollection.insertOne(fileDocument);
    return res.status(201).json({
      id: result.insertedId, userId, name, type, isPublic, parentId,
    });
  }
}
export default FilesController;
