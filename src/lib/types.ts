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

  assigned_to?: string | null;
  assigned_role?: string | null;

  // 🔥 DESIGN → PRINT → DELIVERY pipeline
  design_url?: string | null;       // uploaded by designer
  print_file_url?: string | null;   // passed to printer

  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  role: string;
  name?: string;
  full_name?: string;
  email?: string;
}
