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

async function parseResponse(response) {
  let responseBody;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error(
      `The server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      responseBody.error ||
      responseBody.message ||
      `Request failed with status ${response.status}.`
    );
  }

  return responseBody;
}
export async function createTicket(ticketData) {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  });

  return parseResponse(response);
}


export async function listTickets() {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  return parseResponse(response);
}