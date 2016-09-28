import chai from 'chai';
import { MongoClient, ObjectId } from 'mongodb';
import * as Services from '../services';

chai.should();

let db;

before(() => MongoClient.connect('mongodb://localhost:27017/testing')
  .then(conn => {
    db = conn;
  })
);

describe('Services Service', () => {
  const services = [
    { _id: new ObjectId() },
    { _id: new ObjectId() },
    { _id: new ObjectId() },
  ];

  before(() => db.collection('services').insert(services));

  after(() => db.collection('services').remove({}));

  it(
    'should load services from database',
    () => Services.load(db)
      .then(res => {
        res.should.have.length(3);
      })
  );

  it(
    'should update service in database',
    () => Services.update(db, Object.assign({}, { _id: services[0]._id, title: 'test' }))
      .then(res => {
        res.should.have.property('title').equal('test');
      })
  );

  it(
    'should create service in database',
    () => Services.create(db, Object.assign({}, { title: 'test' }))
      .then(res => {
        res.should.have.property('title').equal('test');
      })
  );
});
