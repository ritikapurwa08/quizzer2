"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

/** Admin data table using shadcn Table primitives. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No data yet.",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-x-auto bg-card shadow-xs">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/40 border-b border-border">
            {columns.map((col) => (
              <TableHead key={col.header} className="text-xs font-bold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
              {columns.map((col) => (
                <TableCell key={col.header} className={`py-3 px-4 text-sm text-foreground ${col.className || ""}`}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
