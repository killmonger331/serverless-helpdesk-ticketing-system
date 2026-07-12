import { createTicket } from "./api.js";

const form = document.getElementById("ticket-form");
const messageElement = document.getElementById("form-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  messageElement.textContent = "Submitting ticket...";

  const formData = new FormData(form);

  const ticketData = {
    title: formData.get("title"),
    description: formData.get("description"),
    priority: Number(formData.get("priority")),
    requesterEmail: formData.get("requesterEmail"),
  };

  try {
    const result = await createTicket(ticketData);

    messageElement.textContent =
      `Ticket created successfully. Ticket number: ${result.ticketId}`;

    form.reset();
  } catch (error) {
    messageElement.textContent = error.message;
  }
});