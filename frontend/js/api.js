import { API_BASE_URL } from "./config.js";
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

export async function getTicket(ticketId) {
  if (!ticketId) {
    throw new Error("A ticket ID is required.");
  }

  const encodedTicketId = encodeURIComponent(ticketId);

  const response = await fetch(
    `${API_BASE_URL}/tickets/${encodedTicketId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  return parseResponse(response);
}

export async function updateTicket(ticketId, updates) {
  if (!ticketId) {
    throw new Error("A ticket ID is required.");
  }

  const encodedTicketId = encodeURIComponent(ticketId);

  const response = await fetch(
    `${API_BASE_URL}/tickets/${encodedTicketId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  return parseResponse(response);
}