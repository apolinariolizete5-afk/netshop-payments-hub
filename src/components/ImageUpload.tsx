import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Carrega uma imagem para o armazenamento e devolve um URL utilizável. */
export function ImageUpload({
  value,
  onChange,
  label = "Carregar imagem",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data, error: signError } = await supabase.storage
        .from("uploads")
        .createSignedUrl(path, TEN_YEARS);
      if (signError || !data) throw signError ?? new Error("Não foi possível gerar o link.");
      onChange(data.signedUrl);
      toast.success("Imagem carregada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao carregar a imagem. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Pré-visualização"
            className="h-16 w-16 rounded-xl border border-border object-cover"
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {label}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" onClick={() => onChange("")}>
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
