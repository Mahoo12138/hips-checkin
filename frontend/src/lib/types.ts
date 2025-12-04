export interface UserInfo {
  id: string;
  loginName: string;
  realName: string;
  phone: string;
  email?: string;
  employeeNum?: string;
  unitName?: string;
  positionName?: string;
  avatarUrl?: string;
}

export interface ProjectInfo {
  projectId: number;
  projectCode: string;
  projectName: string;
  projectTypeId: number;
  siteName: string; // location
  addressId: number; // office id?
  addressName: string; // office name
}

export interface TimeSheetRecord {
  status: 'Empty' | 'Approved' | 'Rejected' | 'Submitted' | 'Saved' | 'Draft'; // Adjust based on actual data
  lockflag: string;
  each_day: string; // YYYYMMDD
  enable: string;
  day: string;
  proj: string;
  allowance: string;
}

export interface CalendarResponse {
  timesheet: TimeSheetRecord[];
  month: string;
}

export interface CheckInRecord {
  id: string;
  date: string;
  projectId: string;
  location: string;
  office: string;
  hasFlyback: boolean;
  description: string;
  submittedAt?: string;
  status?: 'draft' | 'submitted';
}

export interface DefaultProjectResponse {
  status: string;
  project: string;
  every_day: {
    every_day: string;
    project_id: number;
    project_code: string;
    project_name: string;
    project_type_id: number;
    site_name: string;
    prj_address_id: number; // This seems to be the location ID
    address_id: number;
    [key: string]: any;
  };
  projaddress: Array<{
    address_name: string;
    address_id: number;
    selected_flag: string;
  }>;
  [key: string]: any;
}
