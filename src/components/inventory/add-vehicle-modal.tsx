"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from "@/components/ui/primitives";

/**
 * Intake form for new stock. Demo-only: submitting shows a toast and closes —
 * nothing is written to the store.
 */
export function AddVehicleModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast("Vehicle added to intake queue (demo)");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add vehicle" wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Make">
            <Input name="make" placeholder="e.g. Toyota" required />
          </Field>
          <Field label="Model">
            <Input name="model" placeholder="e.g. Camry" required />
          </Field>
          <Field label="Year">
            <Input
              name="year"
              type="number"
              min={1998}
              max={2026}
              defaultValue={2020}
              required
            />
          </Field>
          <Field label="Trim">
            <Input name="trim" placeholder="e.g. XLE" />
          </Field>
          <Field label="Condition">
            <Select name="condition" defaultValue="Foreign Used">
              <option>Brand New</option>
              <option>Foreign Used</option>
              <option>Nigerian Used</option>
            </Select>
          </Field>
          <Field label="Body type">
            <Select name="bodyType" defaultValue="Sedan">
              <option>Sedan</option>
              <option>SUV</option>
              <option>Pickup</option>
              <option>Hatchback</option>
              <option>Bus</option>
            </Select>
          </Field>
          <Field label="Color">
            <Input name="color" placeholder="e.g. Silver" />
          </Field>
          <Field label="Mileage (km)">
            <Input name="mileage" type="number" min={0} placeholder="e.g. 65,000" />
          </Field>
          <Field label="Listing price (₦)">
            <Input
              name="listingPrice"
              type="number"
              min={0}
              step={100000}
              placeholder="e.g. 18,500,000"
              required
            />
          </Field>
          <Field label="Location">
            <Select name="location" defaultValue="Showroom A">
              <option>Showroom A</option>
              <option>Showroom B</option>
              <option>Lot</option>
              <option>Workshop</option>
              <option>Port</option>
            </Select>
          </Field>
        </div>

        <Field label="VIN">
          <Input name="vin" placeholder="17-character VIN" maxLength={17} />
        </Field>

        <p className="flex items-center gap-1.5 rounded-lg bg-accent-subtle px-3 py-2 text-xs text-accent">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Demo environment — new vehicles go to a simulated intake queue.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add vehicle</Button>
        </div>
      </form>
    </Modal>
  );
}
