// API Base URL - Update this after Vercel deployment
// For local testing use: 'http://localhost:3000/api'
// For production use your Vercel URL: 'https://your-project.vercel.app/api'
const API_BASE_URL = 'https://alles-paletti.vercel.app/api';

// API Client for Logistikbude Backend
const api = {
  // Fetch all bookings
  async getBookings() {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  // Fetch all tasks
  async getTasks() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // Complete a task
  async completeTask(taskId, userId = 'Demo User', notes = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, userId, notes }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: error.message };
    }
  },

  // Update booking node (for progress tracking)
  async updateBookingNode(bookingId, nodeSequence, details) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          nodeSequence,
          ...details,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating booking node:', error);
      return { success: false, error: error.message };
    }
  },

  // Update booking details (full edit)
  async updateBooking(bookingId, bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Fetch events
  async getEvents(bookingId = null, limit = 50) {
    try {
      const url = bookingId
        ? `${API_BASE_URL}/events?bookingId=${bookingId}&limit=${limit}`
        : `${API_BASE_URL}/events?limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  },
};

// Export API to global scope for use in other files
window.logistikbudeAPI = api;
