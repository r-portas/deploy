import { createFileRoute } from "@tanstack/react-router";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getDockerInfoFn, getStacksFn } from "@/lib/docker.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [info, stacks] = await Promise.all([getDockerInfoFn(), getStacksFn()]);
    return { info, stacks };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { info, stacks } = Route.useLoaderData();

  const details = [
    ["Server version", info.ServerVersion],
    ["Operating system", info.OperatingSystem],
    ["Architecture", `${info.OSType}/${info.Architecture}`],
    ["Kernel", info.KernelVersion],
    ["CPUs", info.NCPU],
    ["Memory", `${(info.MemTotal / 1024 ** 3).toFixed(1)} GiB`],
    ["Images", info.Images],
  ] as const;

  const containers = [
    ["Running", info.ContainersRunning],
    ["Paused", info.ContainersPaused],
    ["Stopped", info.ContainersStopped],
  ] as const;

  return (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Stacks</CardTitle>
          <CardDescription>{stacks.length} Compose projects</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {stacks.map((stack) => (
            <div key={stack.name}>
              <h3 className="text-sm font-medium">
                {stack.name}{" "}
                <span className="font-normal text-muted-foreground">
                  {stack.runningCount}/{stack.services.length} running
                </span>
              </h3>
              <ul className="mt-2 grid gap-1 text-sm">
                {stack.services.map((service) => (
                  <li key={service.id} className="flex justify-between gap-4">
                    <span>{service.name}</span>
                    <span className="text-muted-foreground">
                      {service.state} · {service.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Docker Engine</CardTitle>
          <CardDescription>{info.Name}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Containers</CardTitle>
          <CardDescription>{info.Containers} total</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {containers.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
