import { ObjectId } from 'mongodb';

export function load(db) {
  return db.collection('services').find({}).toArray();
}

export function update(db, service) {
  return db.collection('services')
    .updateOne({ _id: ObjectId(service._id) }, { $set: service })
    .then(() => db.collection('services').findOne({ _id: ObjectId(service._id) }, {}));
}

export function create(db, service) {
  return db.collection('services')
    .insertOne(service, {})
    .then(res => db.collection('services').findOne({ _id: ObjectId(res.insertedId) }, {}));
}
