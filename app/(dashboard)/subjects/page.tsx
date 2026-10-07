"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { api, ApiError } from "@/lib/fetcher";
import type { SavedSubject } from "@prisma/client";

const SUBJECT_TYPES = [
  { value: "person", label: "Person" },
  { value: "property", label: "Property" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other", label: "Other" },
];

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [subjectType, setSubjectType] = useState("person");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get<{ subjects: SavedSubject[] }>("/api/v1/subjects").then((d) => d.subjects),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/subjects", { label, subjectType, name, relationship, address });
      setOpen(false);
      setLabel("");
      setName("");
      setRelationship("");
      setAddress("");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this saved subject?")) return;
    await api.delete(`/api/v1/subjects/${id}`);
    queryClient.invalidateQueries({ queryKey: ["subjects"] });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Saved People & Places</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {!subjects?.length && <p className="text-text-secondary">No saved subjects yet — add a care recipient or location to reuse across requests.</p>}

      <div className="space-y-3">
        {subjects?.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{s.label || s.name || s.subjectType}</p>
                <p className="text-sm text-text-secondary">{s.address}</p>
              </div>
              <button onClick={() => handleDelete(s.id)} aria-label="Delete" className="text-text-muted hover:text-error p-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a saved subject">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Mum, Aba Property" required />
          <Select label="Type" options={SUBJECT_TYPES} value={subjectType} onChange={(e) => setSubjectType(e.target.value)} />
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Save
          </Button>
        </form>
      </Modal>
    </div>
  );
}
