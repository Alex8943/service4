import amqp from "amqplib";
import logger from "./winstonLogger";
import { Channel, Connection } from "amqplib";
import dotenv from "dotenv";

dotenv.config();
const RABBITMQ_URL = process.env.rabbitmq_url || "amqp://127.0.0.1";

console.log("RabbitMQ URL:", RABBITMQ_URL);

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;


export async function createChannel(): Promise<{ channel: Channel; connection: Connection }> {
    if (!connection) {
        connection = await amqp.connect(RABBITMQ_URL);
        console.log("RabbitMQ connection established.");
    }
    if (!channel) {
        channel = await connection.createChannel();
        console.log(`RabbitMQ channel created`);
    }

    process.on("SIGINT", async () => {
        try {
            if (channel) {
                await channel.close();
                console.log("RabbitMQ channel closed.");
            }
            if (connection) {
                await connection.close();
                console.log("RabbitMQ connection closed.");
            }
        } catch (err) {
            console.error("Error during RabbitMQ shutdown:", err);
        }
        process.exit(0);
    });

    return { channel, connection }; // Return both channel and connection
}

export const sendMessage = async (queueName: string, message: any) => {
    try {
        if (!channel) {
            throw new Error("RabbitMQ channel is not initialized.");
        }

        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });

        console.log(`Message sent to queue ${queueName}: ${JSON.stringify(message)}`);
    } catch (error) {
        logger.error("Error while sending message to RabbitMQ:", error);
        throw error;
    }
};

export const closeRabbitMQ = async () => {
    try {
        await channel?.close();
        await connection?.close();
        logger.info("RabbitMQ connection closed.");
    } catch (error) {
        logger.error("Error while closing RabbitMQ connection:", error);
    }
};
