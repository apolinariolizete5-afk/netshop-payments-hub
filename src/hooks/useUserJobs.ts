import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useSavedJobIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-job-ids", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_jobs").select("job_id");
      if (error) throw error;
      return (data ?? []).map((row) => row.job_id);
    },
  });
}

export function useToggleSavedJob(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, saved }: { jobId: string; saved: boolean }) => {
      if (!userId) throw new Error("Precisa de entrar na sua conta.");
      if (saved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("job_id", jobId)
          .eq("user_id", userId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("saved_jobs")
        .insert({ job_id: jobId, user_id: userId });
      if (error) throw error;
      return true;
    },
    onSuccess: (nowSaved) => {
      queryClient.invalidateQueries({ queryKey: ["saved-job-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      toast.success(nowSaved ? "Vaga guardada" : "Vaga removida das guardadas");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSavedJobs(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-jobs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select(
          "job_id, created_at, jobs(id, slug, title, company_name, location, category, job_type, published_at, summary)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ["applications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, jobs(slug, title, company_name, location)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, link, read, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
