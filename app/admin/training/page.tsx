"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { api, ApiError } from "@/lib/fetcher";
import type { ServiceCategory, TrainingModule } from "@prisma/client";

type ModuleWithCount = TrainingModule & { category: ServiceCategory | null; _count: { progress: number } };

export default function AdminTrainingPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleWithCount | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: modules } = useQuery({
    queryKey: ["admin", "training"],
    queryFn: () => api.get<{ modules: ModuleWithCount[] }>("/api/v1/admin/training").then((d) => d.modules),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => api.get<{ categories: ServiceCategory[] }>("/api/v1/categories").then((d) => d.categories),
  });

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setContent("");
    setCategoryId("");
    setIsPublished(true);
    setModalOpen(true);
  }

  function openEdit(m: ModuleWithCount) {
    setEditing(m);
    setTitle(m.title);
    setDescription(m.description || "");
    setContent(m.content);
    setCategoryId(m.categoryId || "");
    setIsPublished(m.isPublished);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        content,
        categoryId: categoryId || undefined,
        isPublished,
      };
      if (editing) {
        await api.patch(`/api/v1/admin/training/${editing.id}`, payload);
      } else {
        await api.post("/api/v1/admin/training", payload);
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "training"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this training module?")) return;
    await api.delete(`/api/v1/admin/training/${id}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "training"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Provider Training</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New module
        </Button>
      </div>

      <div className="space-y-2">
        {modules?.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-text-primary">
                  {m.title} {!m.isPublished && <span className="text-xs text-text-muted">(draft)</span>}
                </p>
                <p className="text-sm text-text-secondary">{m.description}</p>
                <p className="text-sm text-text-muted mt-1">
                  {m.category?.name || "General"} · {m._count.progress} provider(s) completed
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-4 w-4 text-error" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit module" : "New training module"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Select
            label="Related category (optional)"
            placeholder="General — not tied to a category"
            options={(categories || []).map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <Textarea
            label="Content"
            hint="Plain text, paragraphs separated by a blank line."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
            required
          />
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Published (visible to providers)
          </label>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" isLoading={isSaving}>
            Save
          </Button>
        </form>
      </Modal>
    </div>
  );
}
