import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import type { Job } from "../lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Types ---
interface MeasurementJob {
  id: number;
  customer_name: string;
  mobile: string;
  address: string;
  job_type: string;
  notes: string;
  status: string;
  created_at: string;
}

export default function Attendant() {
  const [loading, setLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // 🆕 Add Item Modal State
  const [addItemModal, setAddItemModal] = useState<{ open: boolean; jobId: number | null }>({ open: false, jobId: null });
  const [newItemForm, setNewItemForm] = useState({
    job_type: "Flex Banner",
    description: "",
    width: "",
    height: "",
    unit: "ft",
    quantity: "1",
    material: "",
    cost: ""
  });


  // --- Form State ---
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    job_card_no: "",
    bill_no: "",
    date: "",
    area: "",
    cost: "",
    advance: "",
    mode_of_payment: "Cash",
    delivery_mode: "office",
    needs_fixing: false,
    is_urgent: false,
    items: [{
      job_type: "Flex Banner",
      description: "",
      sizes: [{ width: "", height: "", unit: "ft", quantity: "" }],
      material: ""
    }]
  });

  const [measurementForm, setMeasurementForm] = useState({
    customer_name: "",
    mobile: "",
    address: "",
    job_type: "Flex Banner",
    notes: "",
  });

  // --- Data State ---
  const [measurementJobs, setMeasurementJobs] = useState<MeasurementJob[]>([]);
  const [pickups, setPickups] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementJob | null>(null);
  const [measurementFiles, setMeasurementFiles] = useState<any[]>([]);

  // 🆕 Search State
  const [searchTerm, setSearchTerm] = useState("");

  const updateDraftJob = async () => {
    if (!editingJob) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Use first item for backward compatibility
    const firstItem = form.items[0];
    const sizeString = firstItem.sizes
      .filter((s: any) => s.width && s.height)
      .map((s: any) => `${s.width}x${s.height}`)
      .join(", ");

    const { error } = await supabase
      .from("jobs")
      .update({
        customer_name: form.customer_name,
        phone: form.phone,
        area: form.area,
        job_type: firstItem.job_type,
        description: firstItem.description,
        size: sizeString,
        quantity: firstItem.sizes[0]?.quantity || "",
        material: firstItem.material,
        cost: form.cost,
        advance: form.advance,
        mode_of_payment: form.mode_of_payment,
        delivery_mode: form.delivery_mode,
        needs_fixing: form.needs_fixing,
        is_urgent: form.is_urgent,
        status: "DESIGN",
        updated_by: user?.id,
        updated_by_name: user?.user_metadata?.full_name,
      })
      .eq("job_id", editingJob.job_id);

    if (error) {
      alert("❌ Failed to update job");
    } else {
      alert("✅ Job sent to Designer");
      setEditingJob(null);
      setForm({
        customer_name: "",
        phone: "",
        job_card_no: "",
        bill_no: "",
        date: "",
        area: "",
        cost: "",
        advance: "",
        mode_of_payment: "Cash",
        delivery_mode: "office",
        needs_fixing: false,
        is_urgent: false,
        items: [{
          job_type: "Flex Banner",
          description: "",
          sizes: [{ width: "", height: "", unit: "ft", quantity: "" }],
          material: ""
        }]
      });
      refreshData();
    }
    setLoading(false);
  };

  const refreshData = async () => {
    const { data: office } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "WAIT_ATTENDANT")
      .eq("delivery_mode", "office");

    const { data: measurements } = await supabase
      .from("measurement_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .neq("status", "CONVERTED");

    const { data: all } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setPickups(office || []);
    setMeasurementJobs(measurements || []);
    setJobs(all || []);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Item Management Helpers ---
  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, {
        job_type: "Flex Banner",
        description: "",
        sizes: [{ width: "", height: "", unit: "ft", quantity: "" }],
        material: ""
      }]
    });
  };

  const removeItem = (index: number) => {
    if (form.items.length === 1) {
      alert("At least one item is required");
      return;
    }
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const updateItemSize = (itemIndex: number, sizeIndex: number, field: 'width' | 'height' | 'quantity', value: string) => {
    const items = [...form.items];
    const sizes = [...items[itemIndex].sizes];
    sizes[sizeIndex] = { ...sizes[sizeIndex], [field]: value };
    items[itemIndex] = { ...items[itemIndex], sizes };
    setForm({ ...form, items });
  };

  const addItemSize = (itemIndex: number) => {
    const items = [...form.items];
    items[itemIndex] = {
      ...items[itemIndex],
      sizes: [...items[itemIndex].sizes, { width: "", height: "", unit: "ft", quantity: "" }]
    };
    setForm({ ...form, items });
  };

  const updateItemSizeUnit = (itemIndex: number, sizeIndex: number, unit: string) => {
    const items = [...form.items];
    const sizes = [...items[itemIndex].sizes];
    sizes[sizeIndex] = { ...sizes[sizeIndex], unit };
    items[itemIndex] = { ...items[itemIndex], sizes };
    setForm({ ...form, items });
  };

  // --- Helpers ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };


  async function downloadJobSheet(job: any) {
    const doc = new jsPDF();

    // --- 1. Fetch Data ---
    const { data: logs } = await supabase
      .from("job_workflow_logs")
      .select("*")
      .eq("job_id", job.job_id)
      .order("time_in", { ascending: true });

    console.log("Fetched logs:", logs);

    // --- 2. Process Logs ---
    const roleMap = new Map<string, any>();

    if (logs && logs.length > 0) {
      logs.forEach((log) => {
        const role = log.stage || log.role || "unknown";

        // Enhanced worker name extraction with multiple fallbacks
        let workerName = log.worker_name;

        // If worker_name is missing, try user_name (email)
        if (!workerName && log.user_name) {
          workerName = log.user_name.split("@")[0];
        }

        // If still no name, use role-specific defaults
        if (!workerName) {
          const roleDefaults: Record<string, string> = {
            'CREATED': 'Attendant',
            'DESIGN': 'Designer',
            'PRINTING': 'Printer',
            'BILLING': 'Biller',
            'FIXING': 'Fixer',
            'DELIVERY': 'Delivery Staff',
            'MEASUREMENT': 'Measurement Staff',
          };
          workerName = roleDefaults[role.toUpperCase()] || "Staff Member";
        }

        if (!roleMap.has(role)) {
          roleMap.set(role, {
            role,
            worker_name: workerName,
            time_in: log.time_in,
            time_out: log.time_out,
          });
        } else {
          const existing = roleMap.get(role);
          // Keep the earliest time_in
          if (!existing.time_in || (log.time_in && log.time_in < existing.time_in)) {
            existing.time_in = log.time_in;
          }
          // Keep the latest time_out
          if (!existing.time_out || (log.time_out && log.time_out > existing.time_out)) {
            existing.time_out = log.time_out;
          }
          // Update worker name if we have a better value (prefer actual names over role defaults)
          if (!existing.worker_name || existing.worker_name.includes("Staff") || existing.worker_name.includes("Attendant")) {
            if (workerName && !workerName.includes("Staff") && !workerName.includes("Attendant")) {
              existing.worker_name = workerName;
            }
          }
        }
      });
    }
    const normalizedLogs = Array.from(roleMap.values());

    // --- 3. PDF STYLING CONFIG ---
    const primaryColor = [41, 128, 185];
    let finalY = 0;

    // --- 4. HEADER SECTION ---

    // Left Side: Company Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text("VALI ARTS AND DIGITAL", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("74-12-38A, New RTC Colony, Patamata, Vijayawada-7", 14, 26);
    doc.text("Cell: +91 7993402115, Ph: 0866-2974729", 14, 31);

    // Right Side: Doc Info
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("JOB SHEET", 196, 20, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 196, 26, { align: "right" });

    // Separator Line (Moved down to Y=36 to clear the address text)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 196, 36);

    // --- 5. JOB & CUSTOMER DETAILS ---
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    // Moved Title down to 45 so it has breathing room from the line
    doc.text("Job Details", 14, 45);

    autoTable(doc, {
      startY: 50,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
        1: { cellWidth: 65 },
        2: { fontStyle: 'bold', cellWidth: 25 },
        3: { cellWidth: 65 }
      },
      body: [
        [
          "Job ID:", job.job_id,
          "Customer:", job.customer_name
        ],
        [
          "Type:", job.job_type || "-",
          "Mobile:", job.phone
        ],
        [
          "Status:", (job.status || "Active").toUpperCase(),
          "Address:", job.area
        ]
      ],
    });

    finalY = (doc as any).lastAutoTable.finalY + 15;

    // --- 6. WORKFLOW LOGS SECTION ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Workflow History", 14, finalY);

    if (normalizedLogs && normalizedLogs.length > 0) {
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Stage / Role", "Performed By", "Start Time", "End Time"]],
        body: normalizedLogs.map((log) => [
          log.role.toUpperCase(),
          log.worker_name,
          formatDate(log.time_in),
          formatDate(log.time_out),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: primaryColor as [number, number, number],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });
    } else {
      // Empty State
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, finalY + 5, 182, 15, 1, 1, "FD");

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Job is pending initial processing steps.", 105, finalY + 14, { align: "center" });
    }

    // --- 7. FOOTER ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount} - Vali Arts & Digital`, 105, 290, { align: "center" });
    }

    doc.save(`JobSheet_${job.job_id}.pdf`);
  }

  // --- 🖨️ PDF Logic ---
  const generateBill = (job: Job) => {
    const doc = new jsPDF();
    const totalCost = parseFloat(job.cost as any) || 0;
    const advancePaid = parseFloat(job.advance as any) || 0;
    const balanceDue = totalCost - advancePaid;

    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(40, 44, 52);
    doc.text("VALI ARTS AND DIGITAL", 14, 20);

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
    doc.text("74-12-38A, New RTC Colony, Patamata, Vijayawada-7", 14, 26);
    doc.text("Cell: +91 7993402115, Ph: 0866-2974729", 14, 31);

    doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 150, 20);

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Invoice No: ${job.bill_no || "N/A"}`, 150, 26);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 31);

    doc.setDrawColor(200); doc.line(14, 38, 196, 38);

    doc.setFont("helvetica", "bold"); doc.text("Bill To:", 14, 48);
    doc.setFont("helvetica", "normal");
    doc.text(`${job.customer_name}`, 14, 54);
    doc.text(`Phone: ${job.phone}`, 14, 60);
    doc.text(`Area: ${job.area || "N/A"}`, 14, 66);

    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Material', 'Size', 'Qty', 'Total']],
      body: [[
        job.description || job.job_type || "N/A",
        job.material || "Standard",
        job.size || "N/A",
        job.quantity || "1",
        `Rs. ${totalCost.toFixed(2)}`
      ]],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold"); doc.text(`Subtotal:`, 140, finalY);
    doc.setFont("helvetica", "normal"); doc.text(`Rs. ${totalCost.toFixed(2)}`, 175, finalY);

    doc.setFont("helvetica", "bold"); doc.text(`Advance:`, 140, finalY + 7);
    doc.setTextColor(200, 0, 0);
    doc.setFont("helvetica", "normal"); doc.text(`- Rs. ${advancePaid.toFixed(2)}`, 175, finalY + 7);

    doc.setTextColor(0, 0, 0); doc.setDrawColor(0); doc.line(140, finalY + 11, 195, finalY + 11);

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`BALANCE DUE:`, 120, finalY + 18);
    doc.text(`Rs. ${balanceDue.toFixed(2)}`, 175, finalY + 18);

    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(150);
    doc.text("Thank you for your business!", 14, finalY + 30);
    doc.text("Note: This is a computer-generated invoice.", 14, finalY + 35);

    doc.save(`Invoice_${job.bill_no}_${job.customer_name}.pdf`);
  };

  // --- Actions ---

  const createJob = async () => {
    if (!form.customer_name || !form.phone) {
      alert("Please enter Customer Name and Phone Number");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Use first item for backward compatibility in main jobs table
    const firstItem = form.items[0];
    const sizeString = firstItem.sizes
      .filter((s: any) => s.width && s.height)
      .map((s: any) => `${s.width}x${s.height}`)
      .join(", ");

    const jobPayload = {
      customer_name: form.customer_name,
      phone: form.phone,
      job_card_no: form.job_card_no,
      bill_no: form.bill_no,
      date: form.date,
      area: form.area,
      job_type: firstItem.job_type,
      description: firstItem.description,
      size: sizeString,
      quantity: firstItem.sizes[0]?.quantity || "",
      material: firstItem.material,
      cost: form.cost,
      advance: form.advance,
      mode_of_payment: form.mode_of_payment,
      delivery_mode: form.delivery_mode,
      needs_fixing: form.needs_fixing,
      is_urgent: form.is_urgent,
      status: "DESIGN",
      assigned_role: "attendant",
      updated_by: user?.id,
      updated_by_name: user?.user_metadata?.full_name,
      created_at: new Date(),
    };

    const { data, error } = await supabase.from("jobs").insert([jobPayload]).select();

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
      return;
    }

    const createdJob = data?.[0];
    if (createdJob) {
      // Insert all items and their sizes into job_items table
      const itemsToInsert: any[] = [];
      form.items.forEach((item, itemIndex) => {
        item.sizes.forEach((size, sizeIndex) => {
          if (size.width && size.height) {
            itemsToInsert.push({
              job_id: createdJob.job_id,
              job_type: item.job_type,
              description: item.description,
              size: `${size.width}x${size.height}`,
              quantity: size.quantity || "",
              material: item.material,
              position: itemIndex * 100 + sizeIndex // Ensure proper ordering
            });
          }
        });
      });

      const { error: itemsError } = await supabase
        .from("job_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error inserting job items:", itemsError);
        // Continue even if items insert fails - main job is created
      }

      // Log workflow
      await supabase.from("job_workflow_logs").insert({
        job_id: createdJob.job_id,
        role: "attendant",
        stage: "CREATED",
        worker_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Attendant",
        user_name: user?.email || null,
        user_id: user?.id || null,
        customer_name: createdJob.customer_name,
        customer_mobile: createdJob.phone,
        time_in: new Date().toISOString(),
        time_out: new Date().toISOString(),
      });
    }

    alert("Job Created Successfully!");
    setForm({
      customer_name: "",
      phone: "",
      job_card_no: "",
      bill_no: "",
      date: "",
      area: "",
      cost: "",
      advance: "",
      mode_of_payment: "Cash",
      delivery_mode: "office",
      needs_fixing: false,
      is_urgent: false,
      items: [{
        job_type: "Flex Banner",
        description: "",
        sizes: [{ width: "", height: "", unit: "ft", quantity: "" }],
        material: ""
      }]
    });
    refreshData();
    setLoading(false);
  };

  const createMeasurementJob = async () => {
    if (!measurementForm.customer_name || !measurementForm.mobile) {
      alert("Please enter customer name & mobile");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("measurement_jobs").insert([
        {
          ...measurementForm,
          created_by: user.id,
          status: "PENDING",
        },
      ]);

      if (error) {
        alert("❌ " + error.message);
      } else {
        alert("✅ Measurement Job Created");
        setMeasurementForm({
          customer_name: "",
          mobile: "",
          address: "",
          job_type: "Flex Banner",
          notes: "",
        });
        refreshData();
      }
    } catch (err) {
      console.error("Error creating measurement:", err);
      alert("Failed to create measurement job");
    } finally {
      setLoading(false);
    }
  };
  // @ts-ignore
  const fetchMeasurementFiles = async (jobId: number) => {
    const { data, error } = await supabase
      .from("measurement_files")
      .select("*")
      .eq("job_id", jobId);

    if (error) console.error(error);
    return data;
  };



  // @ts-ignore
  const convertMeasurementToJob = async (m: MeasurementJob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in");
        return;
      }

      const { error } = await supabase
        .from("jobs")
        .insert({
          customer_name: m.customer_name,
          phone: m.mobile,
          area: m.address,
          job_type: m.job_type,
          description: m.notes,
          status: "ATTENDANT_EDIT",
          delivery_mode: "office",
          source: "MEASUREMENT",
          measurement_id: m.id,
          updated_by: user.id,
          updated_by_name: user.user_metadata?.full_name,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Lock measurement
      const { error: updateError } = await supabase
        .from("measurement_jobs")
        .update({ status: "CONVERTED" })
        .eq("id", m.id);

      if (updateError) throw updateError;

      alert("✅ Job Card Created Successfully");
      refreshData();
    } catch (err) {
      console.error("Error converting measurement:", err);
      alert("❌ Failed to create Job Card");
    }
  };





  const openMeasurement = async (m: MeasurementJob) => {
    setSelectedMeasurement(m);

    try {
      const { data, error } = await supabase
        .from("measurement_files")
        .select("*")
        .eq("job_id", m.id)   // ✅ ONLY THIS
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMeasurementFiles(data || []);
    } catch (err) {
      console.error("Error loading measurement files:", err);
      setMeasurementFiles([]);
    }
  };

  // @ts-ignore
  const closeMeasurementJob = async (m: MeasurementJob) => {
    if (!window.confirm("Are you sure you want to mark this measurement as DONE?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("measurement_jobs")
        .update({
          status: "DONE",
          completed_at: new Date().toISOString(),
        })
        .eq("id", m.id);

      if (error) throw error;

      alert("✅ Measurement job closed");
      setSelectedMeasurement(null);
      setMeasurementFiles([]);
      refreshData();
    } catch (err) {
      console.error("Error closing measurement:", err);
      alert("❌ Failed to close measurement job");
    }
  };

  // Approve design and send to billing
  const approveDesign = async (job: Job) => {
    const confirm = window.confirm(`Approve design for ${job.customer_name} and send to billing?`);
    if (!confirm) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update job status to WAIT_BILLING
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "WAIT_BILLING",
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.job_id);

      if (error) throw error;

      // Log the approval in workflow
      await supabase.from("job_workflow_logs").insert({
        job_id: job.job_id,
        stage: "DESIGN_APPROVED",
        worker_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Attendant",
        user_name: user?.email || null,
        user_id: user?.id || null,
        time_in: new Date().toISOString(),
        time_out: new Date().toISOString(),
      });

      alert("✅ Design approved and sent to billing");
      refreshData();
    } catch (err) {
      console.error("Error approving design:", err);
      alert("❌ Failed to approve design");
    } finally {
      setLoading(false);
    }
  };

  const requestRework = async (job: Job) => {
    const reason = window.prompt("Enter reason for rework:");
    if (reason === null) return; // Cancelled

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Find the last designer who worked on this
      const { data: logs } = await supabase
        .from("job_workflow_logs")
        .select("user_id, worker_name")
        .eq("job_id", job.job_id)
        .eq("stage", "DESIGN")
        .order("time_in", { ascending: false }) // Use time_in as created_at might not exist in log
        .limit(1);

      const lastDesignerId = logs?.[0]?.user_id || null;
      const lastDesignerName = logs?.[0]?.worker_name || "Designer";

      // 2. Update Job Status -> DESIGN (and assign back if we know who)
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "DESIGN",
          assigned_to: lastDesignerId, // Send back to specific designer if known
          assigned_role: "designer",
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.job_id);

      if (error) throw error;

      // 3. Log Rework Request
      await supabase.from("job_workflow_logs").insert({
        job_id: job.job_id,
        stage: "REWORK_REQUESTED",
        worker_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Attendant",
        user_name: user?.email || null,
        user_id: user?.id || null,
        notes: reason || "No reason provided",
        time_in: new Date().toISOString(),
        time_out: new Date().toISOString(),
      });

      alert(`✅ Job sent back to ${lastDesignerName} for rework.`);
      refreshData();
    } catch (err) {
      console.error("Error sending for rework:", err);
      alert("❌ Failed to send for rework");
    } finally {
      setLoading(false);
    }
  };

  const completePickup = async (job: Job) => {
    const confirm = window.confirm(`Confirm pickup for ${job.customer_name}?`);
    if (!confirm) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("jobs")
        .update({
          status: "COMPLETED",
          updated_at: new Date().toISOString()
        })
        .eq("job_id", job.job_id);

      if (error) throw error;

      await supabase.from("job_workflow_logs").insert({
        job_id: job.job_id,
        stage: "COMPLETED",
        worker_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Attendant",
        user_name: user?.email || null,
        user_id: user?.id || null,
        notes: "Item picked up from office",
        time_in: new Date().toISOString(),
        time_out: new Date().toISOString(),
      });

      alert("✅ Job marked as COMPLETED");
      refreshData();
    } catch (err: any) {
      console.error("Error completing pickup:", err);
      alert("❌ Failed to complete pickup: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNewItem = async () => {
    if (!addItemModal.jobId) return;
    setLoading(true);

    try {
      const { job_type, description, width, height, unit, quantity, material, cost } = newItemForm;
      const sizeStr = width && height ? `${width}x${height} ${unit}` : "";
      const itemCost = parseFloat(cost) || 0;

      // 1. Insert Item
      const { error: itemError } = await supabase.from("job_items").insert({
        job_id: addItemModal.jobId,
        job_type,
        description,
        size: sizeStr,
        quantity,
        material,
        cost: itemCost,
        position: 999 // Append to end
      });

      if (itemError) throw itemError;

      // 2. Update Job Cost (Fetch current first)
      const { data: jobData, error: fetchError } = await supabase
        .from("jobs")
        .select("cost, balance")
        .eq("job_id", addItemModal.jobId)
        .single();

      if (fetchError) throw fetchError;

      const newTotal = (jobData.cost || 0) + itemCost;
      const newBalance = (jobData.balance || 0) + itemCost;

      const { error: updateError } = await supabase
        .from("jobs")
        .update({
          cost: newTotal,
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("job_id", addItemModal.jobId);

      if (updateError) throw updateError;

      alert("✅ Item added and cost updated!");
      setAddItemModal({ open: false, jobId: null });
      setNewItemForm({
        job_type: "Flex Banner",
        description: "",
        width: "",
        height: "",
        unit: "ft",
        quantity: "1",
        material: "",
        cost: ""
      });
      refreshData();

    } catch (err: any) {
      console.error("Error adding item:", err);
      alert("❌ Failed to add item: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Header title="Attendant Dashboard" />

      <div style={styles.mainContainer}>

        {/* === COLUMN 1: FORMS (New Order + Measurements) === */}
        <div style={styles.column}>

          {/* Section A: New Order Form */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.dotAvailable} />
              <h3 style={styles.heading}>📝 New Order</h3>
            </div>

            <div style={styles.formContainer}>

              {/* CUSTOMER DETAILS GROUP */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Customer Details</label>
                <input style={styles.input} placeholder="Job Card No" value={form.job_card_no} onChange={(e) => setForm({ ...form, job_card_no: e.target.value })} />
                <input style={styles.input} placeholder="Bill No" value={form.bill_no} onChange={(e) => setForm({ ...form, bill_no: e.target.value })} />
                <input style={styles.input} placeholder="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <input style={styles.input} placeholder="Customer Name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                <input style={styles.input} placeholder="Phone No" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input style={styles.input} placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </div>

              {/* ORDER DETAILS - MULTIPLE ITEMS */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Order Items ({form.items.length})</label>

                {form.items.map((item, itemIndex) => {
                  const itemSizes = item.sizes;
                  const activeSize = itemSizes[itemSizes.length - 1];
                  const w = parseFloat(activeSize.width || "0");
                  const h = parseFloat(activeSize.height || "0");
                  const maxPreview = 100;
                  const scale = Math.max(w, h) > 0 ? maxPreview / Math.max(w, h) : 1;
                  const previewWidth = Math.round(w * scale);
                  const previewHeight = Math.round(h * scale);

                  return (
                    <div key={itemIndex} style={styles.itemCard}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemNumber}>Item {itemIndex + 1}</span>
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(itemIndex)}
                            style={styles.btnRemoveItem}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      <label style={styles.subLabel}>Job Type:</label>
                      <select
                        style={styles.select}
                        value={item.job_type}
                        onChange={(e) => updateItem(itemIndex, "job_type", e.target.value)}
                      >
                        <option value="Flex Banner">Flex Banner</option>
                        <option value="DTP">DTP</option>
                        <option value="Fitting Work">Fitting Work</option>
                        <option value="Vinyl">Vinyl</option>
                      </select>

                      <input
                        style={styles.input}
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(itemIndex, "description", e.target.value)}
                      />

                      {/* Sizes */}
                      <div style={styles.sizeSection}>
                        <label style={styles.subLabel}>Dimensions:</label>
                        {item.sizes.map((s, sizeIndex) => (
                          <div key={sizeIndex} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "center" }}>
                            <input
                              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                              placeholder="H"
                              value={s.height}
                              onChange={(e) => updateItemSize(itemIndex, sizeIndex, "height", e.target.value)}
                            />
                            <span style={styles.dimensionSeparator}>×</span>
                            <input
                              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                              placeholder="W"
                              value={s.width}
                              onChange={(e) => updateItemSize(itemIndex, sizeIndex, "width", e.target.value)}
                            />
                            <select
                              style={styles.unitSelect}
                              value={s.unit || "ft"}
                              onChange={(e) => updateItemSizeUnit(itemIndex, sizeIndex, e.target.value)}
                            >
                              <option value="ft">ft</option>
                              <option value="in">in</option>
                              <option value="cm">cm</option>
                              <option value="mm">mm</option>
                            </select>
                            <input
                              style={{ ...styles.input, marginBottom: 0, width: "80px" }}
                              placeholder="Qty"
                              value={s.quantity || ""}
                              onChange={(e) => updateItemSize(itemIndex, sizeIndex, "quantity", e.target.value)}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          style={styles.btnAddSize}
                          onClick={() => addItemSize(itemIndex)}
                        >
                          ➕ Add Size
                        </button>

                        {w > 0 && h > 0 && (
                          <div style={styles.previewContainer}>
                            <div style={styles.previewLabel}>Visual Preview</div>
                            <div style={{ ...styles.previewBox, width: previewWidth, height: previewHeight }}>
                              {w} × {h}
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        style={styles.input}
                        placeholder="Material"
                        value={item.material}
                        onChange={(e) => updateItem(itemIndex, "material", e.target.value)}
                      />
                    </div>
                  );
                })}

                {/* Add More Variant Button */}
                <button type="button" onClick={addItem} style={styles.btnAddItem}>
                  ➕ Add More Variant
                </button>
              </div>

              {/* Cost & Payment Row */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Payment Details</label>
                <div style={styles.row}>
                  <input style={styles.inputHalf} placeholder="Cost" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                  <input style={styles.inputHalf} placeholder="Advance" type="number" value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} />
                  <select style={styles.selectHalf} value={form.mode_of_payment} onChange={(e) => setForm({ ...form, mode_of_payment: e.target.value })}>
                    <option value="Online">Online</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <select style={styles.selectHalf} value={form.delivery_mode} onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })}>
                    <option value="office">Pickup</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </div>

                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={form.needs_fixing} onChange={(e) => setForm({ ...form, needs_fixing: e.target.checked })} />
                  Requires Fixing?
                </label>

                <label style={{ ...styles.checkboxLabel, color: "#dc2626" }}>
                  <input type="checkbox" checked={form.is_urgent} onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })} />
                  🚨 Urgent Priority
                </label>
              </div>

              <button onClick={createJob} disabled={loading} style={styles.btnPrimary}>
                {loading ? "Creating..." : "Create Job Card"}
              </button>
            </div>
          </div>

          {/* Section B: Create Measurement Request */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={{ ...styles.dotAvailable, backgroundColor: "#8e44ad" }} />
              <h3 style={styles.heading}>📏 New Site Measurement</h3>
            </div>
            <div style={styles.formContainer}>
              <input style={styles.input} placeholder="Customer Name" value={measurementForm.customer_name} onChange={(e) => setMeasurementForm({ ...measurementForm, customer_name: e.target.value })} />
              <input style={styles.input} placeholder="Mobile" value={measurementForm.mobile} onChange={(e) => setMeasurementForm({ ...measurementForm, mobile: e.target.value })} />
              <input style={styles.input} placeholder="Site Address" value={measurementForm.address} onChange={(e) => setMeasurementForm({ ...measurementForm, address: e.target.value })} />
              <textarea style={{ ...styles.input, height: "60px", resize: "none" }} placeholder="Notes (location, shop type, etc)" value={measurementForm.notes} onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })} />

              <button onClick={createMeasurementJob} disabled={loading} style={styles.btnSecondary}>
                Request Measurement
              </button>
            </div>
          </div>
        </div>

        {/* === COLUMN 2: PICKUPS & MEASUREMENTS LIST === */}
        <div style={styles.column}>




          {/* Pickups */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.dotActive} />
              <h3 style={styles.heading}>📦 Ready for Pickup</h3>
            </div>
            <div style={styles.listArea}>
              {pickups.length === 0 && <p style={styles.emptyText}>No items waiting.</p>}
              {pickups.sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)).map((job) => (
                <div key={job.job_id} style={job.is_urgent ? { ...styles.card, ...styles.urgentCard } : styles.card}>
                  <div style={styles.cardRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={styles.cardTitle}>{job.customer_name}</span>
                      {job.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                    </div>
                    <span style={styles.badge}>#{job.job_card_no}</span>
                  </div>
                  <div style={styles.cardMeta}>{job.size} • {job.material} • {job.phone} • Bal: ₹{job.balance || 0}</div>

                  <button
                    onClick={() => completePickup(job)}
                    disabled={loading}
                    style={{ ...styles.btnAction, backgroundColor: "#2ecc71", marginTop: "12px" }}
                  >
                    📦 Mark Handed Over
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Measurements List */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={{ ...styles.dotAvailable, backgroundColor: "#8e44ad" }} />
              <h3 style={styles.heading}>Active Measurements</h3>
            </div>
            <div style={styles.listArea}>
              {measurementJobs.map((m) => (
                <div key={m.id} style={styles.measurementCard}>
                  <div style={styles.cardRow}>
                    <strong>{m.customer_name}</strong>
                    <span style={styles.statusPill}>{m.status}</span>
                  </div>
                  <div style={styles.cardMeta}>{m.address}</div>
                  <button
                    onClick={() => openMeasurement(m)}
                    style={styles.btnSmallAction}
                  >
                    📂 View Files
                  </button>
                  {editingJob ? (
                    <button
                      onClick={updateDraftJob}
                      disabled={loading}
                      style={styles.btnPrimary}
                    >
                      {loading ? "Saving..." : "Submit Job to Designer"}
                    </button>
                  ) : (
                    <button
                      onClick={createJob}
                      disabled={loading}
                      style={styles.btnPrimary}
                    >
                      {loading ? "Creating..." : "Create Job Card"}
                    </button>
                  )}

                </div>
              ))}
            </div>

            {/* Selected Measurement Preview */}
            {selectedMeasurement && (
              <div style={styles.previewPanel}>
                <h4 style={styles.heading}>📂 Site Files for {selectedMeasurement.customer_name}</h4>
                {measurementFiles.length === 0 && (
                  <p style={{ fontSize: "12px", color: "#999" }}>
                    No files uploaded for this measurement.
                  </p>
                )}


                {measurementFiles.map((f) => {
                  const url = f.file_url;

                  return (
                    <div key={`${f.id}-${f.file_path}`} style={{ marginBottom: "10px" }}>
                      {f.file_type === "image" && (
                        <img
                          src={url}
                          alt="Site Image"
                          style={{
                            width: "100%",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                      )}

                      {f.file_type === "video" && (
                        <video controls style={{ width: "100%", borderRadius: "6px" }}>
                          <source src={url} />
                        </video>
                      )}

                      {f.file_type === "audio" && (
                        <audio controls style={{ width: "100%" }}>
                          <source src={url} />
                        </audio>
                      )}

                      {f.file_type === "document" && (
                        <a href={url} target="_blank" style={styles.link}>
                          📄 Open Document
                        </a>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    setSelectedMeasurement(null);
                    setMeasurementFiles([]);
                  }}
                  style={{ ...styles.btnSecondary, backgroundColor: "#95a5a6", marginTop: "10px" }}
                >
                  ❌ Close Preview
                </button>
              </div>
            )}
          </div>
        </div>
        {/* === COLUMN 3: LIVE TRACKER === */}
        <div style={styles.column}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.heading}>📊 Live Tracker</h3>
            </div>

            {/* 🔍 Search Bar */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#fff" }}>
              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center"
              }}>
                <span style={{
                  position: "absolute",
                  left: "12px",
                  fontSize: "14px",
                  color: "#94a3b8",
                  pointerEvents: "none"
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by Bill No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px", // Left padding for icon
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    backgroundColor: "#f8fafc",
                    transition: "all 0.2s ease",
                    color: "#334155",
                    fontWeight: 500
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.backgroundColor = "#f8fafc";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div style={styles.trackerList}>
              {jobs
                .filter(job => {
                  if (!searchTerm) return true;
                  const billNo = job.bill_no?.toLowerCase() || "";
                  const search = searchTerm.toLowerCase();
                  return billNo.includes(search);
                })
                .sort((a, b) => ((b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)))
                .map((job) => {
                  // Parse design files
                  const designUrls = job.design_url
                    ? job.design_url.split(',').map(url => url.trim()).filter(Boolean)
                    : [];

                  const itemStyle = job.is_urgent
                    ? { ...styles.trackerItem, ...styles.urgentCard }
                    : styles.trackerItem;

                  return (
                    <div key={job.job_id} style={itemStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.trackerTitle}>
                          {job.bill_no || `#${job.job_id}`}
                          {job.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                          {designUrls.length > 0 && (
                            <span style={styles.designBadge}>
                              🎨 {designUrls.length} Design{designUrls.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div style={styles.trackerSub}>{job.customer_name} • {job.job_type}• {job.phone}</div>

                        {/* Design Files Section */}
                        {designUrls.length > 0 && (
                          <div style={styles.designFilesContainer}>
                            <div style={styles.designFilesLabel}>📥 Design Files:</div>
                            <div style={styles.designButtonsRow}>
                              {designUrls.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.btnDownloadDesign}
                                >
                                  ⬇️ Design {index + 1}
                                </a>
                              ))}
                              {job.status === "DESIGN_REVIEW" && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button
                                    onClick={() => approveDesign(job)}
                                    disabled={loading}
                                    style={styles.btnApproveDesign}
                                  >
                                    ✅ Approve
                                  </button>
                                  <button
                                    onClick={() => requestRework(job)}
                                    disabled={loading}
                                    style={styles.btnRework}
                                  >
                                    🔄 Rework
                                  </button>
                                  <button
                                    onClick={() => setAddItemModal({ open: true, jobId: job.job_id })}
                                    disabled={loading}
                                    style={styles.btnAddItem}
                                  >
                                    ➕ Item
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <button onClick={() => generateBill(job)} style={styles.btnPrint}>
                          🖨️ Print Bill
                        </button>
                        <button
                          onClick={() => downloadJobSheet(job)} style={styles.btndwn}
                        >
                          Download Job Sheet PDF
                        </button>

                      </div>
                      <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(job.status) }}>
                        {job.status}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

      </div>

      {/* --- ADD ITEM MODAL --- */}
      {addItemModal.open && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.heading}>Add Extra Item</h3>
            </div>

            <div style={styles.formContainer} >
              <label style={styles.subLabel}>Job Type:</label>
              <select
                style={styles.select}
                value={newItemForm.job_type}
                onChange={(e) => setNewItemForm({ ...newItemForm, job_type: e.target.value })}
              >
                <option value="Flex Banner">Flex Banner</option>
                <option value="DTP">DTP</option>
                <option value="Fitting Work">Fitting Work</option>
                <option value="Vinyl">Vinyl</option>
              </select>

              <input
                style={styles.input}
                placeholder="Description"
                value={newItemForm.description}
                onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="H"
                  value={newItemForm.height}
                  onChange={(e) => setNewItemForm({ ...newItemForm, height: e.target.value })}
                />
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="W"
                  value={newItemForm.width}
                  onChange={(e) => setNewItemForm({ ...newItemForm, width: e.target.value })}
                />
                <select
                  style={styles.unitSelect}
                  value={newItemForm.unit}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                >
                  <option value="ft">ft</option>
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Material"
                  value={newItemForm.material}
                  onChange={(e) => setNewItemForm({ ...newItemForm, material: e.target.value })}
                />
                <input
                  style={{ ...styles.input, width: '80px' }}
                  placeholder="Qty"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm({ ...newItemForm, quantity: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                <label style={{ ...styles.subLabel, color: 'green' }}>Add Cost:</label>
                <input
                  style={{ ...styles.input, borderColor: 'green' }}
                  placeholder="Extra Cost (₹)"
                  type="number"
                  value={newItemForm.cost}
                  onChange={(e) => setNewItemForm({ ...newItemForm, cost: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setAddItemModal({ open: false, jobId: null })}
                  style={{ ...styles.btnSecondary, flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveNewItem}
                  disabled={loading}
                  style={{ ...styles.btnPrimary, flex: 1 }}
                >
                  {loading ? "Saving..." : "Save Item"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
const getStatusColor = (status: string) => {
  switch (status) {
    case "DESIGN": return "#3498db";
    case "DESIGN_REVIEW": return "#a855f7"; // Purple
    case "WAIT_BILLING": return "#8e44ad";
    case "PRINTING": return "#e67e22";
    case "DELIVERY": return "#9b59b6";
    case "COMPLETED": return "#2ecc71";
    default: return "#95a5a6";
  }
};

const styles: Record<string, React.CSSProperties> = {
  mainContainer: { display: "grid", gridTemplateColumns: "340px 320px 1fr", gap: "20px", padding: "20px", maxWidth: "1600px", margin: "0 auto", alignItems: "start" },
  column: { display: "flex", flexDirection: "column", gap: "20px" },
  section: { backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" },
  sectionHeader: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc" },
  heading: { margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" },

  // Forms
  formContainer: { padding: "16px" },
  inputGroup: { marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px dashed #020202" },
  label: { fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "block" },
  subLabel: { fontSize: "11px", fontWeight: "bold", marginBottom: "4px", display: "block", color: "#555" },

  input: { width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" },
  inputHalf: { width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #0d0d0e", borderRadius: "6px", fontSize: "13px", backgroundColor: "#414141" },
  selectHalf: { width: "100%", padding: "10px", border: "1px solid #000000", borderRadius: "6px", fontSize: "13px", backgroundColor: "#414141" },
  row: { display: "flex", gap: "8px", marginBottom: "10px" },

  // Buttons
  btnPrimary: { width: "100%", padding: "12px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "13px", marginTop: "10px" },
  btnSecondary: { width: "100%", padding: "12px", backgroundColor: "#8e44ad", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "13px", marginTop: "10px" },
  btnAddSize: { backgroundColor: "#34495e", color: "white", border: "none", padding: "8px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer", width: "100%", marginBottom: "10px" },
  btnAddItem: { backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  btnRemoveItem: { backgroundColor: "#ef4444", color: "white", border: "none", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, cursor: "pointer" },

  // Item Cards
  itemCard: { padding: "16px", marginBottom: "16px", backgroundColor: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: "8px", position: "relative" as const },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #cbd5e1" },
  itemNumber: { fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase" as const },

  // Unit Labels
  unitLabel: { fontSize: "11px", fontWeight: 600, color: "#64748b", minWidth: "20px", textAlign: "center" as const },
  unitSelect: { fontSize: "11px", fontWeight: 600, color: "#64748b", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "4px", backgroundColor: "white", cursor: "pointer", minWidth: "50px" },
  dimensionSeparator: { fontSize: "16px", fontWeight: 600, color: "#94a3b8", padding: "0 4px" },

  // Cards (Pickups/Measurements)
  listArea: { padding: "16px", maxHeight: "60vh", overflowY: "auto" },
  card: { padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "10px", backgroundColor: "white", borderLeft: "4px solid #f39c12" },
  measurementCard: { padding: "12px", borderRadius: "8px", border: "1px solid #f3e8ff", marginBottom: "10px", backgroundColor: "#faf5ff", borderLeft: "4px solid #8e44ad" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  cardTitle: { fontWeight: 600, fontSize: "14px", color: "#334155" },
  cardMeta: { fontSize: "12px", color: "#64748b" },
  badge: { fontSize: "12px", fontWeight: "bold" },
  statusPill: { fontSize: "10px", backgroundColor: "#eee", padding: "2px 5px", borderRadius: "4px" },
  btnAction: { width: "100%", marginTop: "8px", padding: "8px", backgroundColor: "#34495e", color: "white", borderRadius: "4px", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: 600 },
  btnSmallAction: { width: "100%", marginTop: "8px", padding: "6px", backgroundColor: "#34495e", color: "white", borderRadius: "4px", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: "bold" },
  btnRework: {
    padding: "4px 10px",
    backgroundColor: "#e67e22", // Orange
    color: "white",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    display: "inline-block",
    transition: "background-color 0.2s"
  },

  // New Styles

  modalOverlay: {
    position: "fixed" as const, // Fix for type error
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  },
  modalHeader: {
    marginBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px"
  },

  // Preview
  previewContainer: { padding: "10px", border: "1px dashed #aaa", borderRadius: "8px", backgroundColor: "#f9f9f9", textAlign: "center", marginBottom: "10px" },
  previewLabel: { fontSize: "11px", color: "#777", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" },
  previewBox: { backgroundColor: "#2ecc71", border: "2px solid #27ae60", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", borderRadius: "4px", margin: "0 auto" },
  previewPanel: { marginTop: "10px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" },
  thumb: { width: "100%", borderRadius: "6px", border: "1px solid #e2e8f0" },
  link: { fontSize: "12px", color: "#2563eb", fontWeight: 600 },

  // OTP
  otpBox: { padding: "16px", backgroundColor: "#white", border: "2px solid #16a34a", borderRadius: "10px" },
  otpHeader: { margin: "0 0 10px 0", fontSize: "14px", color: "#333", fontWeight: "bold" },
  inputOtp: { width: "100%", padding: "10px", border: "1px solid #000", borderRadius: "4px", marginBottom: "8px", fontSize: "14px" },
  btnVerify: { width: "100%", padding: "12px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" },

  // Tracker
  trackerList: { padding: "0 16px 16px", maxHeight: "75vh", overflowY: "auto" },
  trackerItem: { padding: "10px 0", borderBottom: "1px solid #201b1b", display: "flex", alignItems: "start", justifyContent: "space-between" },
  trackerTitle: { fontSize: "14px", fontWeight: "bold", color: "#000" },
  trackerSub: { fontSize: "11px", color: "#555" },
  btnPrint: { marginTop: "5px", backgroundColor: "#333", border: "1px solid #ddd", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", color: "white", display: "flex", gap: "4px", alignItems: "center" },
  btndwn: { marginTop: "5px", backgroundColor: "#333", border: "1px solid #ddd", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", color: "white", display: "flex", gap: "4px", alignItems: "center" },
  statusBadge: { fontSize: "10px", padding: "4px 8px", borderRadius: "12px", color: "white", fontWeight: "bold", textTransform: "uppercase", minWidth: "70px", textAlign: "center" },

  // Design Files
  designBadge: { marginLeft: "8px", fontSize: "10px", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "12px", fontWeight: "600" },
  designFilesContainer: { marginTop: "8px", marginBottom: "8px", padding: "8px", backgroundColor: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" },
  designFilesLabel: { fontSize: "10px", fontWeight: "bold", color: "#0369a1", marginBottom: "6px", textTransform: "uppercase" },
  designButtonsRow: { display: "flex", gap: "6px", flexWrap: "wrap" },
  btnDownloadDesign: {
    padding: "4px 10px",
    backgroundColor: "#0ea5e9",
    color: "white",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    textDecoration: "none",
    cursor: "pointer",
    display: "inline-block",
    transition: "background-color 0.2s"
  },
  btnApproveDesign: {
    padding: "4px 10px",
    backgroundColor: "#10b981",
    color: "white",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    display: "inline-block",
    transition: "background-color 0.2s"
  },

  // Urgent Job Styles
  urgentCard: {
    borderLeft: "4px solid #ef4444",
    backgroundColor: "#fff5f5",
    padding: "12px",
    borderRadius: "0 8px 8px 0",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
    borderBottom: "none"
  },
  urgentBadge: {
    backgroundColor: "#ef4444",
    color: "white",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase" as const
  },

  // Misc
  dotAvailable: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" },
  dotActive: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#555", marginTop: "10px", fontWeight: "bold" },
  emptyText: { textAlign: "center", fontSize: "12px", color: "#999", padding: "20px" }
};