// src/app/models/event.model.ts

export interface EventModel {
  EventId: number | null; // null for new events, number for existing
  EventName: string;
  EventDate: string; // Use string for ISO date format
  EventCategory: 'Upcoming' | 'Happenings'; // Dropdown values
  EventDetails: string;
  ImageUrl: string;
  // Based on your API, these may also be needed for a complete model:
  Action?: 'Insert' | 'Update' | 'Delete' | 'View';
  EventFileData?: any;
  DisapprovalReason?: string;
  LoginName?: string;
}

export interface ApiResponse {
  // Assuming your API returns a simple structure for Insert/Update/Delete
  success: boolean;
  message: string;
  // And a list of events for the 'View' action
  events?: EventModel[];
}