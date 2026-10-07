"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VerifiedBadge, StatusBadge } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { api, ApiError } from "@/lib/fetcher";
import type { ProviderProfile, ServiceCategory, ProviderCategory } from "@prisma/client";

type FullProviderProfile = ProviderProfile & { categories: (ProviderCategory & { category: ServiceCategory })[] };

export default function ProviderProfilePage() {
  const queryClient = useQueryClient();
  const [idDoc, setIdDoc] = useState<string[]>([]);
  const [selfie, setSelfie] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [hourlyRate, setHourlyRate] = useState("");
  const [coverageRadiusKm, setCoverageRadiusKm] = useState("10");
  const [acceptsCheckAm, setAcceptsCheckAm] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["provider", "profile"],
    queryFn: () => api.get<{ profile: FullProviderProfile | null }>("/api/v1/provider/profile").then((d) => d.profile),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => api.get<{ categories: ServiceCategory[] }>("/api/v1/categories").then((d) => d.categories),
  });

  useEffect(() => {
    if (profile) {
      setHourlyRate(profile.hourlyRate?.toString() || "");
      setCoverageRadiusKm(profile.coverageRadiusKm.toString());
      setAcceptsCheckAm(profile.acceptsCheckAm);
      setSelectedCategories(profile.categories.map((c) => c.categoryId));
    }
  }, [profile]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    setIsVerifying(true);
    try {
      await api.post("/api/v1/provider/verification", { idDocumentUrl: idDoc[0], selfieUrl: selfie[0] });
      queryClient.invalidateQueries({ queryKey: ["provider", "profile"] });
    } catch (err) {
      setVerifyError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsVerifying(false);
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategories((cats) => (cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id]));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setIsSaving(true);
    try {
      await api.patch("/api/v1/provider/profile", {
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        coverageRadiusKm: parseInt(coverageRadiusKm, 10),
        acceptsCheckAm,
        categoryIds: selectedCategories,
      });
      queryClient.invalidateQueries({ queryKey: ["provider", "profile"] });
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Provider Profile</h1>
        {profile && <StatusBadge status={profile.verificationStatus} />}
      </div>

      {profile?.verificationStatus === "approved" && (
        <Card>
          <CardContent>
            <VerifiedBadge />
          </CardContent>
        </Card>
      )}

      {profile?.verificationStatus !== "approved" && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">Identity verification</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <PhotoUpload photos={idDoc} onChange={(p) => setIdDoc(p.slice(-1))} min={1} max={1} />
              <p className="text-xs text-text-muted -mt-2">Upload your NIN slip, voter&apos;s card, driver&apos;s licence, or passport.</p>
              <PhotoUpload photos={selfie} onChange={(p) => setSelfie(p.slice(-1))} min={1} max={1} />
              <p className="text-xs text-text-muted -mt-2">Take a clear selfie for liveness verification.</p>
              {profile?.adminNotes && (
                <p className="text-sm text-error">Previous submission note: {profile.adminNotes}</p>
              )}
              {verifyError && <p role="alert" className="text-sm text-error">{verifyError}</p>}
              <Button type="submit" isLoading={isVerifying} disabled={!idDoc[0] || !selfie[0]}>
                Submit for review
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Services & coverage</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Service categories</p>
              <div className="flex flex-wrap gap-2">
                {categories?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      selectedCategories.includes(c.id)
                        ? "border-primary bg-primary-light text-primary-dark"
                        : "border-border text-text-secondary"
                    }`}
                    aria-pressed={selectedCategories.includes(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <Input
              type="number"
              label="Hourly rate (₦, optional)"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
            <Input
              type="number"
              label="Coverage radius (km)"
              value={coverageRadiusKm}
              onChange={(e) => setCoverageRadiusKm(e.target.value)}
              max={50}
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={acceptsCheckAm}
                onChange={(e) => setAcceptsCheckAm(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Accept Help Me Check Am jobs
            </label>

            {profileError && <p role="alert" className="text-sm text-error">{profileError}</p>}
            <Button type="submit" isLoading={isSaving}>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/profile/provider/availability" className="block text-primary-dark font-medium">
        Set your availability →
      </Link>

      <Link href="/profile/provider/earnings" className="block text-primary-dark font-medium">
        View earnings & stats →
      </Link>
    </div>
  );
}
