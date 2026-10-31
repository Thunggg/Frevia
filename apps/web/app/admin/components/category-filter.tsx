"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";

interface CategoryFilterProps {
  categories: { id: number; name: string }[];
  currentValue?: string;
}

export function CategoryFilter({
  categories,
  currentValue,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("adminNav");

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("categoryId", value);
    } else {
      params.delete("categoryId");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={currentValue ?? ""} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px] h-9">
        <SelectValue placeholder={t("allCategories")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allCategories")}</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={String(cat.id)}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
