"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (term.trim()) router.push(`/search?q=${encodeURIComponent(term.trim())}`);
      }}
      className="relative w-full max-w-sm"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search subjects, topics, sets..."
        className="pl-9"
      />
    </form>
  );
}
