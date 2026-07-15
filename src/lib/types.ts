export type Role =
  | "super_admin"
  | "admin"
  | "ceo"
  | "cmo"
  | "manager"
  | "operator"
  | "staff";

export type Department =
  | "Sales"
  | "Logistics"
  | "Workshop"
  | "Admin"
  | "Marketing";

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  department: Department;
  email: string;
  phone: string;
  avatar: string;
  status: "active" | "inactive";
  lastActive: string; // ISO date
}

export type VehicleCondition = "Brand New" | "Foreign Used" | "Nigerian Used";

export type VehicleStatus =
  | "Available"
  | "Reserved"
  | "Sold"
  | "In Repair"
  | "In Transit";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  vin: string;
  color: string;
  mileageKm: number;
  condition: VehicleCondition;
  bodyType: "Sedan" | "SUV" | "Pickup" | "Hatchback" | "Bus";
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Diesel" | "Hybrid";
  purchasePrice: number; // Naira
  clearingCost: number;
  repairCost: number;
  listingPrice: number;
  status: VehicleStatus;
  daysInStock: number; // computed at seed time from acquiredAt
  acquiredAt: string; // ISO date
  soldAt?: string;
  soldPrice?: number;
  assignedTo?: string; // user id (salesperson)
  photo: string; // remote URL
  location: "Showroom A" | "Showroom B" | "Lot" | "Workshop" | "Port";
}

export type ExpenseCategory =
  | "Fuel & Generator"
  | "Vehicle Repairs"
  | "Customs & Clearing"
  | "Salaries"
  | "Rent"
  | "Marketing"
  | "Utilities"
  | "Logistics";

export type ExpenseStatus = "Pending" | "Approved" | "Rejected";

export interface Expense {
  id: string;
  date: string; // ISO date
  category: ExpenseCategory;
  description: string;
  amount: number; // Naira
  submittedBy: string; // user id
  status: ExpenseStatus;
  approvedBy?: string; // user id
  department: Department;
}

export type EquipmentCondition = "Good" | "Fair" | "Needs Service" | "Broken";

export interface Equipment {
  id: string;
  name: string;
  category:
    | "Power"
    | "Workshop"
    | "Diagnostics"
    | "Vehicles"
    | "Office"
    | "Security";
  purchaseDate: string;
  cost: number;
  condition: EquipmentCondition;
  location: string;
  lastServicedAt: string;
  nextServiceDue: string;
  assignedTo?: string; // user id
  notes?: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  date: string;
  description: string;
  cost: number;
  by: string; // user id
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO datetime
  durationMins: number;
  location: string;
  agenda: string[];
  attendees: string[]; // user ids
  organizer: string; // user id
  tier: "exec" | "management" | "all"; // visibility hint
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string; // user id
  department: Department;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
}

export interface Goal {
  id: string;
  title: string;
  quarter: string; // e.g. "Q3 2026"
  metric: string;
  target: number;
  current: number;
  unit: "units" | "naira" | "percent";
  owner: string; // user id
}

export interface BudgetLine {
  category: ExpenseCategory;
  monthlyBudget: number;
}

export interface Activity {
  id: string;
  date: string; // ISO datetime
  actor: string; // user id
  action: string; // human sentence fragment, e.g. 'marked Toyota Camry 2018 as Sold'
  module:
    | "inventory"
    | "expenses"
    | "equipment"
    | "meetings"
    | "operations"
    | "planning"
    | "users";
}

export interface Campaign {
  id: string;
  name: string;
  channel: "Radio" | "Instagram" | "Facebook" | "Billboard" | "Jiji.ng" | "Referral";
  monthlySpend: number;
  leads: number;
  salesAttributed: number;
  status: "Active" | "Paused";
}

/** A month of historical sales, for charts. */
export interface MonthlySales {
  month: string; // e.g. "Feb 2026"
  unitsSold: number;
  revenue: number;
  profit: number;
}
