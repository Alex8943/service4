import express from 'express';
import cors from 'cors';
import logger from './other_services/winstonLogger';
import reviewRouter from './routes/reviewRouter';
import { createChannel } from './other_services/rabbitMQ';
const app = express();
app.use(cors());

app.use(express.json()); // for parsing application/json

//testDBConnection();
//createBackup();

app.use(reviewRouter)

process.on('SIGINT', () => {
    logger.end();
    console.log('See ya later silly');
    process.exit(0);
  });

app.listen(3004, async () => {
  console.log("Connecting to RabbitMQ...");
    await createChannel();
    console.log("Connected to RabbitMQ");
    console.log("Server4 is running on port 3004");
})

