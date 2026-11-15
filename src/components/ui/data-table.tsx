"use client";

import {
  Table as FlowbiteTable,
  TableBody as FlowbiteTableBody,
  type TableBodyProps,
  TableCell as FlowbiteTableCell,
  type TableCellProps,
  TableHead as FlowbiteTableHead,
  TableHeadCell as FlowbiteTableHeadCell,
  type TableHeadCellProps,
  type TableHeadProps,
  type TableProps,
  TableRow as FlowbiteTableRow,
  type TableRowProps,
} from "flowbite-react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

/**
 * Tabla tabular basada en `Table` de `flowbite-react` y el tema monocromático
 * editorial de DolyNation (historial de lecturas y registros académicos).
 */
export function DataTable({
  hoverable = true,
  className = "",
  ...rest
}: TableProps) {
  return (
    <FlowbiteTable
      hoverable={hoverable}
      theme={dolyFlowbiteTheme.table}
      className={className}
      {...rest}
    />
  );
}

export function DataTableHead(props: TableHeadProps) {
  return <FlowbiteTableHead {...props} />;
}

export function DataTableHeadCell(props: TableHeadCellProps) {
  return <FlowbiteTableHeadCell {...props} />;
}

export function DataTableBody(props: TableBodyProps) {
  return <FlowbiteTableBody {...props} />;
}

export function DataTableRow(props: TableRowProps) {
  return <FlowbiteTableRow {...props} />;
}

export function DataTableCell(props: TableCellProps) {
  return <FlowbiteTableCell {...props} />;
}
