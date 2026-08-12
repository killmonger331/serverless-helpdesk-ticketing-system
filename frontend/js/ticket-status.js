import { lookupTicket } from "./api.js";

const ticketLookupForm = document.getElementById("ticketLookupForm");

const ticketIdInput = document.getElementById("ticketId");
const requesterEmailInput = document.getElementById("requesterEmail");

const lookupMessage = document.getElementById("lookupMessage");
const ticketResult = document.getElementById("ticketResult");

const resultTicketId = document.getElementById("resultTicketId");
const resultTitle = document.getElementById("resultTitle");
const resultStatus = document.getElementById("resultStatus");
const resultPriority = document.getElementById("resultPriority");
const resultCreated = document.getElementById("resultCreated");
const resultUpdated = document.getElementById("resultUpdated");


function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}


function formatDate(dateString) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString();
}


function renderTicket(ticket) {
  resultTicketId.textContent =
    ticket.ticketId || "Unknown";

  resultTitle.textContent =
    ticket.title || "Untitled ticket";

  resultStatus.textContent =
    formatStatus(ticket.status);

  resultPriority.textContent =
    ticket.priority !== undefined
      ? `Priority ${ticket.priority}`
      : "Unknown";

  resultCreated.textContent =
    formatDate(ticket.createdAt);

  resultUpdated.textContent =
    formatDate(ticket.updatedAt);

  ticketResult.hidden = false;
}


ticketLookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ticketId = ticketIdInput.value.trim();
  const requesterEmail = requesterEmailInput.value.trim();

  lookupMessage.hidden = false;
  lookupMessage.textContent = "Looking up ticket...";

  ticketResult.hidden = true;

  try {
    const result = await lookupTicket(
      ticketId,
      requesterEmail
    );

    if (!result.ticket) {
      throw new Error(
        "The server did not return ticket information."
      );
    }

    renderTicket(result.ticket);

    lookupMessage.hidden = true;
  } catch (error) {
    lookupMessage.hidden = false;
    lookupMessage.textContent =
      error.message ||
      "Unable to look up ticket.";

    ticketResult.hidden = true;
  }
});