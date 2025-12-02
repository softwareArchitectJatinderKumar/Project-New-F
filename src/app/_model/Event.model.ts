// src/app/models/event.model.ts

export interface EventModel {
  eventId: number ; // null for new events, number for existing
  eventName: string;
  eventDate: string; // Use string for ISO date format
  eventCategory: 'Upcoming' | 'Happenings'; // Dropdown values
  eventDetails: string;
  imageUrl: string;
  // Based on your API, these may also be needed for a complete model:
  Action?: 'Insert' | 'Update' | 'Delete' | 'View';
  eventFileData?: any;
  disapprovalReason?: string;
  LoginName?: string;
}

export interface ApiResponse {
  // Assuming your API returns a simple structure for Insert/Update/Delete
  success: boolean;
  message: string;
  // And a list of events for the 'View' action
  events?: EventModel[];
}