import { listTickets } from "./api.js";

const tableContainer = document.getElementById("ticket-table-container");
const tableBody = document.getElementById("ticket-table-body");
const queueMessage = document.getElementById("queue-message");
const emptyState = document.getElementById("empty-state");
const ticketCount = document.getElementById("ticket-count");
const refreshButton = document.getElementById("refresh-button");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const ticketSearch = document.getElementById("ticket-search");
let tickets = [];
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
    createCell(ticket.ticketId || "Unknown", "ticket-id-cell")
  );
  row.appendChild(
    createCell(ticket.title || "Untitled ticket")
  );
  row.appendChild(
    createCell(ticket.requesterEmail || "Unknown")
  );
  const priorityCell = document.createElement("td");
  priorityCell.appendChild(
    createPriorityBadge(ticket.priority ?? "?")
  );
  row.appendChild(priorityCell);
  const statusCell = document.createElement("td");
  statusCell.appendChild(
    createStatusBadge(ticket.status)
  );
  row.appendChild(statusCell);
  row.appendChild(
    createCell(formatCreatedAt(ticket.createdAt))
  );
  return row;
}
function getFilteredTickets() {
  const selectedStatus = statusFilter.value;
  const selectedPriority = priorityFilter.value;
  const searchTerm = ticketSearch.value.trim().toLowerCase();
  return tickets.filter((ticket) => {
    const matchesStatus =
      selectedStatus === "ALL" ||
      ticket.status === selectedStatus;
    const matchesPriority =
      selectedPriority === "ALL" ||
      String(ticket.priority) === selectedPriority;
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
      `${totalCount} ${totalCount === 1 ? "ticket" : "tickets"}`;
    return;
  }
  ticketCount.textContent =
    `${displayedCount} of ${totalCount} tickets`;
}
function renderTickets() {
  const filteredTickets = getFilteredTickets();
  tableBody.replaceChildren();
  updateTicketCount(filteredTickets.length);
  queueMessage.hidden = true;
  if (filteredTickets.length === 0) {
    tableContainer.hidden = true;
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  tableContainer.hidden = false;
  for (const ticket of filteredTickets) {
    tableBody.appendChild(createTicketRow(ticket));
  }
}
async function loadTickets() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";
  queueMessage.hidden = false;
  queueMessage.textContent = "Loading tickets...";
  tableContainer.hidden = true;
  emptyState.hidden = true;
  try {
    const result = await listTickets();

    tickets = Array.isArray(result.tickets)
      ? result.tickets
      : [];
    renderTickets();
  } catch (error) {
    tickets = [];
    queueMessage.hidden = false;
    queueMessage.textContent =
      `Unable to load tickets: ${error.message}`;
    ticketCount.textContent = "Unavailable";
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh";
  }
}
refreshButton.addEventListener("click", loadTickets);
statusFilter.addEventListener("change", renderTickets);
priorityFilter.addEventListener("change", renderTickets);
ticketSearch.addEventListener("input", renderTickets);
loadTickets();