import { ObjectId } from 'mongodb';

export function load(db) {
  return db.collection('services').find({}).toArray();
}

export function update(db, service) {
  const { title } = service;

  return db.collection('services')
    .updateOne({ _id: ObjectId(service._id) }, { $set: { title } })
    .then(() => db.collection('services').findOne({ _id: ObjectId(service._id) }, {}));
}

export function create(db, service) {
  const { title } = service;

  return db.collection('services')
    .insertOne({ title }, {})
    .then(res => db.collection('services').findOne({ _id: ObjectId(res.insertedId) }, {}));
}
