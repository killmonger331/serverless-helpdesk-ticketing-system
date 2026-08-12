import { API_BASE_URL } from "./config.js";
import {
  getValidIdToken,
  clearSession,
} from "./session.js";

async function getAdminHeaders() {
  const token =
    await getValidIdToken();
  if (!token) {
    clearSession();
    window.location.href =
      "./login.html";
    throw new Error(
      "Administrator authentication required."
    );
  }
  return {
    "Content-Type":
      "application/json",

    "Authorization":
      token,
  };
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
  const headers =
    await getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/tickets`,
    {
      method: "GET",
      headers,
    }
  );
  return parseResponse(response);
}

export async function getTicket(ticketId) {
  if (!ticketId) {
    throw new Error("A ticket ID is required.");
  }
  const encodedTicketId =
    encodeURIComponent(ticketId);
  const headers =
    await getAdminHeaders();
  const response = await fetch(
    `${API_BASE_URL}/tickets/${encodedTicketId}`,
    {
      method: "GET",
      headers,
    }
  );
  return parseResponse(response);
}

export async function updateTicket(
  ticketId,
  updates
) {
  if (!ticketId) {
    throw new Error("A ticket ID is required.");
  }

  const encodedTicketId =
    encodeURIComponent(ticketId);

  const headers =
    await getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/tickets/${encodedTicketId}`,
    {
      method: "PATCH",
      headers,

      body:
        JSON.stringify(updates),
    }
  );

  return parseResponse(response);
}

export async function lookupTicket(ticketId, requesterEmail) {
  const response = await fetch(`${API_BASE_URL}/tickets/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticketId,
      requesterEmail,
    }),
  });

  return parseResponse(response);
}