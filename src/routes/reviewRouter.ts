import express from "express";
import { Review as Reviews } from "../other_services/model/seqModel";
import logger from "../other_services/winstonLogger";
import { sendMessage } from "../other_services/rabbitMQ";

const router = express.Router();


router.put("/update/review/:id", async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id, 10);
        console.log("Request body: ", req.body, "Review ID: ", reviewId);

        const result = await updateReview(reviewId, req.body);
        res.status(200).send(result);
    } catch (error) {
        console.error("Error updating review: ", error);
        res.status(500).send({ error: "Something went wrong with updating the review." });
    }
});

export async function updateReview(id: number, data: any) {
    try {
        if (!data.title || !data.description) {
            throw new Error("Title and description are required.");
        }

        console.log(`Attempting to update review with ID: ${id}, Data:`, data);

        // Send message to RabbitMQ
        const message = {
            event: "review_updated",
            reviewId: id,
            updatedData: data,
        };
        await sendMessage("review-update-service", message);

        console.log("Message sent to RabbitMQ for review update:", message);

        // Update the review regardless of its `isBlocked` status
        const [updatedCount] = await Reviews.update(
            {
                title: data.title,
                description: data.description,
            },
            {
                where: { id: id }, // Match only on `id`
                paranoid: false,  // Include soft-deleted rows
            }
        );

        console.log(`Number of rows updated: ${updatedCount}`);

        if (updatedCount === 0) {
            throw new Error(`No review found with id ${id}`);
        }

        logger.info(`Review with ID ${id} updated successfully.`);
        return { message: `Review with ID ${id} updated successfully.` };
    } catch (error) {
        logger.error("Error during review update: ", error);
        throw error;
    }
}





export default router;
