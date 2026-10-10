import type { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "PRJ-101",
    name: "Invoice Reconciliation",
    description: "Improve reconciliation speed and reliability for mid-market finance teams.",
    ownerId: "maya-chen",
  },
  {
    id: "PRJ-102",
    name: "Bulk Invoice Actions",
    description: "Allow finance operators to apply actions to multiple invoices safely.",
    ownerId: "maya-chen",
  },
  {
    id: "PRJ-103",
    name: "Cash Flow Forecasting",
    description: "Help finance teams understand near-term cash positions and the factors that influence forecasts.",
    ownerId: "nadia-brooks",
  },
];

export const projectById = (id: string): Project | undefined => projects.find((p) => p.id === id);
