"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/fetcher";
import type { ServiceCategory, TrainingModule, ProviderTrainingProgress } from "@prisma/client";

type ModuleWithProgress = TrainingModule & {
  category: ServiceCategory | null;
  progress: ProviderTrainingProgress[];
};

export default function ProviderTrainingPage() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<ModuleWithProgress | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const { data: modules } = useQuery({
    queryKey: ["provider", "training"],
    queryFn: () => api.get<{ modules: ModuleWithProgress[] }>("/api/v1/provider/training").then((d) => d.modules),
  });

  async function markComplete(moduleId: string) {
    setIsCompleting(true);
    try {
      await api.post(`/api/v1/provider/training/${moduleId}/complete`);
      queryClient.invalidateQueries({ queryKey: ["provider", "training"] });
      setActive(null);
    } finally {
      setIsCompleting(false);
    }
  }

  const completedCount = modules?.filter((m) => m.progress.length > 0).length || 0;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/profile/provider" className="flex items-center gap-1 text-sm text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to provider profile
      </Link>
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-primary-dark" />
        <h1 className="text-2xl font-bold text-text-primary">Training</h1>
      </div>
      {!!modules?.length && (
        <p className="text-sm text-text-secondary">
          {completedCount} of {modules.length} modules completed
        </p>
      )}

      <div className="space-y-3">
        {modules?.map((m) => {
          const isDone = m.progress.length > 0;
          return (
            <button key={m.id} onClick={() => setActive(m)} className="w-full text-left">
              <Card className="hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-text-muted flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-text-primary">{m.title}</p>
                    <p className="text-sm text-text-secondary">{m.description}</p>
                    {m.category && <p className="text-xs text-text-muted mt-1">{m.category.name}</p>}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {!modules?.length && <p className="text-text-secondary">No training modules available yet.</p>}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title || ""}>
        {active && (
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-text-secondary max-h-96 overflow-y-auto">
              {active.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {active.progress.length > 0 ? (
              <p className="text-sm font-medium text-success flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </p>
            ) : (
              <Button onClick={() => markComplete(active.id)} isLoading={isCompleting} className="w-full">
                Mark as completed
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
