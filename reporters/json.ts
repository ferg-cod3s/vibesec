import { ScanResult } from '../scanner/core/types';

export class JsonReporter {
  generate(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }
}
