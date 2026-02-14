export interface JobItem {
  id?: number;
  job_id?: number;
  job_type: string;
  description: string;
  size: string;
  quantity: string;
  material: string;
  position?: number;
  cost?: number;
  created_at?: string;
}

export interface Job {
  job_id: number;

  job_card_no?: string;
  bill_no?: string;
  date?: string;

  customer_name: string;
  phone: string;
  area?: string;

  job_type?: string;
  description?: string;
  size?: string;
  quantity?: number;
  material?: string;

  total?: number;
  advance?: number;
  balance?: number;
  mode_of_payment?: Text;

  cost: number;
  delivery_pdf?: string;

  status: string;
  delivery_mode?: string;
  needs_fixing?: boolean;
  is_urgent?: boolean;

  assigned_to?: string | null;
  assigned_role?: string | null;

  // 🔥 DESIGN → PRINT → DELIVERY pipeline
  design_url?: string | null;       // uploaded by designer
  print_file_url?: string | null;   // passed to printer

  created_at?: string;
  updated_at?: string;

  // 🆕 Multiple items support
  items?: JobItem[];

  // 🔐 OTP & Security
  otp_code?: string | null;
  otp_verified?: boolean;
  otp_generated_at?: string | null;
  otp_attempts?: number;
}

export interface User {
  id: string;
  role: string;
  name?: string;
  full_name?: string;
  email?: string;
  username?: string;
  experience?: string;
}
