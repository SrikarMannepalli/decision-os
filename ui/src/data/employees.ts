import type { Employee } from "@/types";

export const employees: Employee[] = [
  { id: "maya-chen", name: "Maya Chen", role: "Senior Product Manager", department: "Product", email: "maya.chen@finflow.example" },
  { id: "arjun-mehta", name: "Arjun Mehta", role: "Engineering Manager", department: "Engineering", email: "arjun.mehta@finflow.example" },
  { id: "priya-nair", name: "Priya Nair", role: "Staff Backend Engineer", department: "Engineering", email: "priya.nair@finflow.example" },
  { id: "leo-fischer", name: "Leo Fischer", role: "Product Designer", department: "Design", email: "leo.fischer@finflow.example" },
  { id: "nadia-brooks", name: "Nadia Brooks", role: "Data Analyst", department: "Data", email: "nadia.brooks@finflow.example" },
  { id: "sam-rivera", name: "Sam Rivera", role: "Customer Success Lead", department: "Customer Success", email: "sam.rivera@finflow.example" },
  { id: "olivia-grant", name: "Olivia Grant", role: "VP of Product", department: "Product", email: "olivia.grant@finflow.example" },
  { id: "ethan-cole", name: "Ethan Cole", role: "Security Engineer", department: "Security", email: "ethan.cole@finflow.example" },
  { id: "zoe-park", name: "Zoe Park", role: "QA Engineer", department: "Quality", email: "zoe.park@finflow.example" },
  { id: "daniel-okafor", name: "Daniel Okafor", role: "Frontend Engineer", department: "Engineering", email: "daniel.okafor@finflow.example" },
];

export const employeeById = (id: string): Employee | undefined => employees.find((e) => e.id === id);
