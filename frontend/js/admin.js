import {
  requireAuthentication,
  logout,
} from "./session.js";
import {
  getTicket,
  listTickets,
  updateTicket,
} from "./api.js";

const tableContainer = document.getElementById("ticket-table-container");
const tableBody = document.getElementById("ticket-table-body");
const queueMessage = document.getElementById("queue-message");
const emptyState = document.getElementById("empty-state");
const ticketCount = document.getElementById("ticket-count");
const refreshButton = document.getElementById("refresh-button");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const ticketSearch = document.getElementById("ticket-search");
const detailPanel = document.getElementById("ticket-detail-panel");
const detailMessage = document.getElementById("ticket-detail-message");
const detailContent = document.getElementById("ticket-detail-content");
const closeDetailButton = document.getElementById("close-detail-button");
const detailTicketId = document.getElementById("detail-ticket-id");
const detailStatus = document.getElementById("detail-status");
const detailPriority = document.getElementById("detail-priority");
const detailRequester = document.getElementById("detail-requester");
const detailCreated = document.getElementById("detail-created");
const detailUpdated = document.getElementById("detail-updated");
const detailTitle = document.getElementById("detail-title");
const detailDescription = document.getElementById("detail-description");
const updateForm = document.getElementById("ticket-update-form");
const updateStatus = document.getElementById("update-status");
const updatePriority = document.getElementById("update-priority");
const updateTicketButton = document.getElementById("update-ticket-button");
const updateMessage = document.getElementById("ticket-update-message");
const authenticated =
  await requireAuthentication();
if (!authenticated) {
  throw new Error(
    "Authentication required."
  );
}
const logoutButton =
  document.getElementById(
    "logout-button"
  );
logoutButton.addEventListener(
  "click",
  () => {
    logout();
  }
);
let tickets = [];
let selectedTicketId = null;

function formatStatus(status) {
  const statusNames = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return statusNames[status] || status || "Unknown";
}

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return "Unknown";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}


function createCell(text, className = "") {
  const cell = document.createElement("td");

  cell.textContent = text;

  if (className) {
    cell.className = className;
  }

  return cell;
}


function createStatusBadge(status) {
  const badge = document.createElement("span");

  badge.className = [
    "status-badge",
    `status-${String(status).toLowerCase()}`,
  ].join(" ");

  badge.textContent = formatStatus(status);

  return badge;
}


function createPriorityBadge(priority) {
  const badge = document.createElement("span");

  badge.className = [
    "priority-badge",
    `priority-${priority}`,
  ].join(" ");

  badge.textContent = `P${priority}`;

  return badge;
}


function createTicketRow(ticket) {
  const row = document.createElement("tr");

  row.dataset.ticketId = ticket.ticketId || "";

  row.appendChild(
    createCell(
      ticket.ticketId || "Unknown",
      "ticket-id-cell"
    )
  );

  row.appendChild(
    createCell(
      ticket.title || "Untitled ticket"
    )
  );

  row.appendChild(
    createCell(
      ticket.requesterEmail || "Unknown"
    )
  );

  const priorityCell = document.createElement("td");

  priorityCell.appendChild(
    createPriorityBadge(
      ticket.priority ?? "?"
    )
  );

  row.appendChild(priorityCell);

  const statusCell = document.createElement("td");

  statusCell.appendChild(
    createStatusBadge(ticket.status)
  );

  row.appendChild(statusCell);

  row.appendChild(
    createCell(
      formatCreatedAt(ticket.createdAt)
    )
  );

  row.tabIndex = 0;
  row.setAttribute("role", "button");

  row.setAttribute(
    "aria-label",
    `Open ticket ${ticket.ticketId}`
  );

  row.addEventListener("click", () => {
    openTicketDetails(ticket.ticketId);
  });

  row.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      openTicketDetails(ticket.ticketId);
    }
  });

  return row;
}


function renderTicketDetails(ticket) {
  detailTicketId.textContent =
    ticket.ticketId || "Unknown";

  detailStatus.textContent =
    formatStatus(ticket.status);

  detailPriority.textContent =
    ticket.priority !== undefined
      ? `Priority ${ticket.priority}`
      : "Unknown";

  detailRequester.textContent =
    ticket.requesterEmail || "Unknown";

  detailCreated.textContent =
    formatCreatedAt(ticket.createdAt);

  detailUpdated.textContent =
    formatCreatedAt(ticket.updatedAt);

  detailTitle.textContent =
    ticket.title || "Untitled ticket";

  detailDescription.textContent =
    ticket.description ||
    "No description provided.";

  updateStatus.value =
    ticket.status || "OPEN";

  updatePriority.value =
    ticket.priority !== undefined
      ? String(ticket.priority)
      : "4";
}


async function openTicketDetails(ticketId) {
  selectedTicketId = ticketId;

  detailPanel.hidden = false;

  detailMessage.hidden = false;
  detailMessage.textContent =
    "Loading ticket details...";

  detailContent.hidden = true;
  updateForm.hidden = true;

  updateMessage.hidden = true;
  updateMessage.textContent = "";

  detailPanel.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  try {
    const result = await getTicket(ticketId);

    if (!result.ticket) {
      throw new Error(
        "The server did not return a ticket."
      );
    }

    renderTicketDetails(result.ticket);

    detailMessage.hidden = true;
    detailContent.hidden = false;
    updateForm.hidden = false;
  } catch (error) {
    detailMessage.hidden = false;

    detailMessage.textContent =
      `Unable to load ticket: ${error.message}`;
  }
}


function closeTicketDetails() {
  selectedTicketId = null;

  detailPanel.hidden = true;
  detailContent.hidden = true;
  detailMessage.hidden = true;

  updateForm.hidden = true;
  updateMessage.hidden = true;
  updateMessage.textContent = "";
}


function getFilteredTickets() {
  const selectedStatus =
    statusFilter.value;

  const selectedPriority =
    priorityFilter.value;

  const searchTerm =
    ticketSearch.value
      .trim()
      .toLowerCase();

  return tickets.filter((ticket) => {
    const matchesStatus =
      selectedStatus === "ALL" ||
      ticket.status === selectedStatus;

    const matchesPriority =
      selectedPriority === "ALL" ||
      String(ticket.priority) ===
        selectedPriority;

    const searchableText = [
      ticket.ticketId,
      ticket.title,
      ticket.requesterEmail,
      ticket.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !searchTerm ||
      searchableText.includes(searchTerm);

    return (
      matchesStatus &&
      matchesPriority &&
      matchesSearch
    );
  });
}


function updateTicketCount(displayedCount) {
  const totalCount = tickets.length;

  if (displayedCount === totalCount) {
    ticketCount.textContent =
      `${totalCount} ${
        totalCount === 1
          ? "ticket"
          : "tickets"
      }`;

    return;
  }

  ticketCount.textContent =
    `${displayedCount} of ${totalCount} tickets`;
}


function renderTickets() {
  const filteredTickets =
    getFilteredTickets();

  tableBody.replaceChildren();

  updateTicketCount(
    filteredTickets.length
  );

  queueMessage.hidden = true;

  if (filteredTickets.length === 0) {
    tableContainer.hidden = true;
    emptyState.hidden = false;

    return;
  }

  emptyState.hidden = true;
  tableContainer.hidden = false;

  for (const ticket of filteredTickets) {
    tableBody.appendChild(
      createTicketRow(ticket)
    );
  }
}


async function loadTickets() {
  refreshButton.disabled = true;

  refreshButton.textContent =
    "Refreshing...";

  queueMessage.hidden = false;
  queueMessage.textContent =
    "Loading tickets...";

  tableContainer.hidden = true;
  emptyState.hidden = true;

  try {
    const result =
      await listTickets();

    tickets =
      Array.isArray(result.tickets)
        ? result.tickets
        : [];

    renderTickets();
  } catch (error) {
    tickets = [];

    queueMessage.hidden = false;

    queueMessage.textContent =
      `Unable to load tickets: ${error.message}`;

    ticketCount.textContent =
      "Unavailable";
  } finally {
    refreshButton.disabled = false;

    refreshButton.textContent =
      "Refresh";
  }
}


async function handleTicketUpdate(event) {
  event.preventDefault();

  if (!selectedTicketId) {
    updateMessage.hidden = false;

    updateMessage.textContent =
      "No ticket is currently selected.";

    return;
  }

  const updates = {
    status: updateStatus.value,
    priority: Number(
      updatePriority.value
    ),
  };

  updateTicketButton.disabled = true;
  updateTicketButton.textContent =
    "Updating...";
  updateMessage.hidden = false;
  updateMessage.textContent =
    "Updating ticket...";
  try {
    const result = await updateTicket(
      selectedTicketId,
      updates
    );
    if (!result.ticket) {
      throw new Error(
        "The server did not return the updated ticket."
      );
    }
    const updatedTicket =
      result.ticket;
    renderTicketDetails(
      updatedTicket
    );
    const ticketIndex =
      tickets.findIndex(
        (ticket) =>
          ticket.ticketId ===
          updatedTicket.ticketId
      );
    if (ticketIndex !== -1) {
      tickets[ticketIndex] =
        updatedTicket;
    }
    renderTickets();

    updateMessage.hidden = false;

    updateMessage.textContent =
      "Ticket updated successfully.";
  } catch (error) {
    updateMessage.hidden = false;

    updateMessage.textContent =
      `Unable to update ticket: ${error.message}`;
  } finally {
    updateTicketButton.disabled = false;

    updateTicketButton.textContent =
      "Update ticket";
  }
}

closeDetailButton.addEventListener("click", closeTicketDetails);
refreshButton.addEventListener("click", loadTickets);
statusFilter.addEventListener("change", renderTickets);
priorityFilter.addEventListener("change", renderTickets);
ticketSearch.addEventListener("input", renderTickets);
updateForm.addEventListener("submit", handleTicketUpdate);

loadTickets();