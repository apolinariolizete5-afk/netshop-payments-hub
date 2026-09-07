import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobSearchBar({
  defaultValue = "",
  onSubmit,
  placeholder = "Cargo, empresa ou palavra-chave",
  autoFocus,
}: {
  defaultValue?: string;
  onSubmit: (term: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState(defaultValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(term.trim());
  };

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={term}
          autoFocus={autoFocus}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={placeholder}
          aria-label="Pesquisar vagas"
          className="h-12 rounded-xl pl-9"
        />
      </div>
      <Button type="submit" className="h-12 shrink-0 rounded-xl px-4">
        Pesquisar
      </Button>
    </form>
  );
}
