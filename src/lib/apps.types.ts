import { type DockerContainer } from "./apps.schemas";

export interface ComposeApp {
  /**
   * The path to the app's Docker Compose file
   * @remarks
   * This is unique, so suitable to use as a id.
   */
  path: string;

  /**
   * The name of the app
   */
  name: string;
}

export interface App extends ComposeApp {
  /**
   * Whether any container for this app's compose project is currently
   * running.
   */
  running: boolean;

  /**
   * The containers `docker ps` currently reports for this app.
   */
  containers: DockerContainer[];

  /**
   * The distinct host ports exposed across this app's containers.
   */
  ports: string[];
}
