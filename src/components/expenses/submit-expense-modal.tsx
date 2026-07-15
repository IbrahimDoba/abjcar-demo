"use client";

import * as React from "react";
import type { Department, ExpenseCategory } from "@/lib/types";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import { formatDate } from "@/lib/format";
import { BUDGET } from "@/data/seed/expenses";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from "@/components/ui/primitives";

const CATEGORIES: ExpenseCategory[] = BUDGET.map((b) => b.category);

const DEPARTMENTS: Department[] = [
  "Sales",
  "Logistics",
  "Workshop",
  "Admin",
  "Marketing",
];

/** The staff half of the signature flow: submit → lands in the ledger as Pending. */
export function SubmitExpenseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const me = useCurrentUser();
  const addExpense = useAppStore((s) => s.addExpense);
  const { toast } = useToast();

  const [category, setCategory] = React.useState<ExpenseCategory>(CATEGORIES[0]);
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [department, setDepartment] = React.useState<Department>(
    me?.department ?? "Admin"
  );

  // When the modal (re)opens, default the department to the current user's —
  // adjusted during render, per React's "you might not need an effect" pattern.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && me) setDepartment(me.department);
  }

  if (!me) return null;

  const parsedAmount = Number(amount);
  const valid = description.trim().length > 0 && parsedAmount > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !me) return;
    addExpense({
      date: new Date().toISOString(),
      category,
      description: description.trim(),
      amount: parsedAmount,
      submittedBy: me.id,
      department,
    });
    toast("Expense submitted for approval");
    setDescription("");
    setAmount("");
    setCategory(CATEGORIES[0]);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Submit expense">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Category">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Diesel top-up — showroom generator"
            autoFocus
          />
        </Field>

        <Field label="Amount (₦)">
          <Input
            type="number"
            min={0}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 250000"
          />
        </Field>

        <Field label="Department">
          <Select
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Date">
          <div className="flex h-9.5 items-center rounded-lg border bg-surface px-3 text-sm text-muted">
            Today · {formatDate(new Date().toISOString())}
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid}>
            Submit for approval
          </Button>
        </div>
      </form>
    </Modal>
  );
}
