export interface Section {
  id: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  room: string;
  campus: string;
}

export interface Course {
  id: string;
  name: string;
  prerequisites: string[]; // US-06
  sections: Section[];
  credits: number;
}
