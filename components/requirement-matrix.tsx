import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type MatrixRow = {
  requirement: string;
  matchLevel: "strong" | "partial" | "gap" | "unknown";
  evidence: string;
};

const MATCH_LABEL: Record<MatrixRow["matchLevel"], string> = {
  strong: "Strong",
  partial: "Partial",
  gap: "Missing",
  unknown: "Unknown",
};

const MATCH_VARIANT: Record<MatrixRow["matchLevel"], "default" | "secondary" | "destructive"> = {
  strong: "default",
  partial: "secondary",
  gap: "destructive",
  unknown: "secondary",
};

export function RequirementMatrix({ rows }: { rows: MatrixRow[] }) {
  if (rows.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requirement</TableHead>
          <TableHead>Match</TableHead>
          <TableHead>Evidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{row.requirement}</TableCell>
            <TableCell>
              <Badge variant={MATCH_VARIANT[row.matchLevel]}>{MATCH_LABEL[row.matchLevel]}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{row.evidence}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
