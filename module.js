import { getRabbitConnection } from './rabbit-connection';
import { getMongoConnection } from './mongo-connection';
import winston from 'winston';
import * as Services from './services';

function sendResponseToMsg(ch, msg, data) {
  return ch.sendToQueue(
    msg.properties.replyTo,
    new Buffer(JSON.stringify(data)),
    { correlationId: msg.properties.correlationId }
  );
}

Promise
// wait for connection to RabbitMQ and MongoDB
  .all([getRabbitConnection(), getMongoConnection()])
  // create channel rabbit
  .then(([conn, db]) => Promise.all([conn.createChannel(), db]))
  .then(([ch, db]) => {
    // create topic
    ch.assertExchange('events', 'topic', { durable: true });
    // create queue
    ch.assertQueue('services-service', { durable: true })
      .then(q => {
        // fetch by one message from queue
        ch.prefetch(1);
        // bind queue to topic
        ch.bindQueue(q.queue, 'events', 'services.*');
        // listen to new messages
        ch.consume(q.queue, msg => {
          let data;

          try {
            // messages always should be JSONs
            data = JSON.parse(msg.content.toString());
          } catch (err) {
            // log error and exit
            winston.error(err, msg.content.toString());
            return;
          }

          // map a routing key with actual logic
          switch (msg.fields.routingKey) {
            case 'services.load':
              Services.load(db) // logic call
                .then(services => sendResponseToMsg(ch, msg, services)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            case 'services.update':
              Services.update(db, data) // logic call
                .then(service => sendResponseToMsg(ch, msg, service)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            case 'services.create':
              Services.create(db, data) // logic call
                .then(service => sendResponseToMsg(ch, msg, service)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            default:
              // if we can't process this message, we should send it back to queue
              ch.nack(msg);
              return;
          }
        });
      });
  });
