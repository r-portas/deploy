import { AppTableRow } from "@/components/apps/app-table-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { App } from "@/lib/apps.types";

export function AppTable({ apps }: { apps: App[] }) {
  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Containers</TableHead>
            <TableHead>Ports</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No apps found. Clone a repo with a Docker Compose file to get started.
              </TableCell>
            </TableRow>
          ) : (
            apps.map((app) => <AppTableRow key={app.path} app={app} />)
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
