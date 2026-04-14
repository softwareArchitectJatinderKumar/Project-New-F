// src/app/models/event.model.ts

export interface CifMouModel {

MouId: number;
MOUTitle : string;
MOUDocumentUrl : string;
MOUDocumentData : string;
MouStartDate : string;
MouEndDate : string;
MOURemarks : string;
   
  Action?: 'Insert' | 'Update' | 'Delete' | 'View';
  eventFileData?: any;
  ApprovalRemarks : string;
  UserId : string;
}

export interface ApiResponse {
  // Assuming your API returns a simple structure for Insert/Update/Delete
  success: boolean;
  message: string;
  // And a list of events for the 'View' action
  events?: CifMouModel[];
}