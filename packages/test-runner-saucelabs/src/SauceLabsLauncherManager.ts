import { BrowserLauncher } from '@web/test-runner-core';
import SaucelabsAPI, {
  SauceLabsOptions,
  SauceConnectOptions,
  SauceConnectInstance,
} from 'saucelabs';

export class SauceLabsLauncherManager {
  private launchers = new Set<BrowserLauncher>();
  private connectionPromise?: Promise<SauceConnectInstance>;
  private connection?: SauceConnectInstance;
  private options: SauceLabsOptions;
  private connectOptions?: SauceConnectOptions;

  constructor(options: SauceLabsOptions, connectOptions?: SauceConnectOptions) {
    this.options = options;
    this.connectOptions = connectOptions;

    process.on('SIGINT', this.closeConnection);
    process.on('SIGTERM', this.closeConnection);
    process.on('beforeExit', this.closeConnection);
  }

  async registerLauncher(launcher: BrowserLauncher) {
    this.launchers.add(launcher);

    if (this.connectionPromise != null) {
      await this.connectionPromise;
      return;
    }

    const api = new SaucelabsAPI(this.options);
    this.connectionPromise = api.startSauceConnect(this.connectOptions ?? {});
    this.connection = await this.connectionPromise;
  }

  async deregisterLauncher(launcher: BrowserLauncher) {
    this.launchers.delete(launcher);

    if (this.launchers.size === 0) {
      this.closeConnection();
    }
  }

  private closeConnection = async () => {
    if (this.connection == null && this.connectionPromise == null) {
      // already closed
      return;
    }

    if (this.connection == null) {
      // wait for connection to finish opening
      await this.connectionPromise;
    }

    if (this.connection != null) {
      this.connection.close();
    }
    this.connection = undefined;
    this.connectionPromise = undefined;
  };
}
