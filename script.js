const STORAGE_KEY = "campusEventsV1";

const form = document.getElementById("eventForm");
const editingId = document.getElementById("editingId");
const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventVenue = document.getElementById("eventVenue");
const eventDescription = document.getElementById("eventDescription");
const eventImage = document.getElementById("eventImage");
const eventsGrid = document.getElementById("eventsGrid");
const emptyMessage = document.getElementById("emptyMessage");
const eventCount = document.getElementById("eventCount");
const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");
const toast = document.getElementById("toast");

let events = loadEvents();

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function renderEvents() {
  events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  eventCount.textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
  emptyMessage.style.display = events.length ? "none" : "block";

  eventsGrid.innerHTML = events.map(event => `
    <article class="event-card">
      <img class="event-image"
           src="${event.image || "college-logo.jpg"}"
           alt="${escapeHTML(event.name)}">
      <div class="event-body">
        <h3>${escapeHTML(event.name)}</h3>
        <div class="event-meta">📅 ${formatDate(event.date)}</div>
        <div class="event-meta">⏰ ${escapeHTML(event.time)}</div>
        <div class="event-meta">📍 ${escapeHTML(event.venue)}</div>
        <p class="event-description">${escapeHTML(event.description)}</p>

        <div class="card-actions">
          <button class="small-button" onclick="registerForEvent('${event.id}')">Register</button>
          <button class="small-button edit" onclick="editEvent('${event.id}')">Edit</button>
          <button class="small-button delete" onclick="deleteEvent('${event.id}')">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

function registerForEvent(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  const name = prompt(`Enter student name for "${event.name}":`);
  if (!name || !name.trim()) return;

  const registrations = JSON.parse(localStorage.getItem("campusRegistrationsV1") || "[]");
  registrations.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    eventId: id,
    eventName: event.name,
    studentName: name.trim(),
    registeredAt: new Date().toISOString()
  });

  localStorage.setItem("campusRegistrationsV1", JSON.stringify(registrations));
  showToast("Registration successful!");
}

function deleteEvent(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  if (!confirm(`Delete "${event.name}"?`)) return;

  events = events.filter(e => e.id !== id);
  saveEvents();
  renderEvents();
  showToast("Event deleted.");
}

function editEvent(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  editingId.value = event.id;
  eventName.value = event.name;
  eventDate.value = event.date;
  eventTime.value = event.time;
  eventVenue.value = event.venue;
  eventDescription.value = event.description;

  submitButton.textContent = "Update Event";
  cancelEdit.classList.remove("hidden");
  document.getElementById("host").scrollIntoView({ behavior: "smooth" });
}

cancelEdit.addEventListener("click", () => {
  resetForm();
});

function resetForm() {
  form.reset();
  editingId.value = "";
  submitButton.textContent = "Create Event";
  cancelEdit.classList.add("hidden");
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const imageData = await readImage(eventImage.files[0]);
  const id = editingId.value;

  if (id) {
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return;

    events[index] = {
      ...events[index],
      name: eventName.value.trim(),
      date: eventDate.value,
      time: eventTime.value,
      venue: eventVenue.value.trim(),
      description: eventDescription.value.trim(),
      image: imageData || events[index].image
    };

    showToast("Event updated.");
  } else {
    events.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: eventName.value.trim(),
      date: eventDate.value,
      time: eventTime.value,
      venue: eventVenue.value.trim(),
      description: eventDescription.value.trim(),
      image: imageData
    });

    showToast("Event created successfully.");
  }

  saveEvents();
  renderEvents();
  resetForm();
  document.getElementById("events").scrollIntoView({ behavior: "smooth" });
});

renderEvents();
