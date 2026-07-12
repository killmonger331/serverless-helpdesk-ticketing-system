import { API_BASE_URL } from "./config.js";

export async function createTicket(ticketData) {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
    });
    if (!response.ok) {
        throw new Error("Failed to create ticket");
    }
    const responseBody = await response.json();

    if (!response.ok) {
        throw new Error(
            responseBody.error ||
            responseBody.message ||
            "Ticket submission failed."
        );
    }

    return responseBody;
}