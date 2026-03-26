export interface GenerationController {
  tryStart(): number | null;
  isActive(runId: number): boolean;
  finish(runId: number): void;
}

class SingleGenerationController implements GenerationController {
  private activeRunId: number | null = null;
  private nextRunId = 1;

  tryStart(): number | null {
    if (this.activeRunId !== null) {
      return null;
    }

    const runId = this.nextRunId;
    this.activeRunId = runId;
    this.nextRunId += 1;

    return runId;
  }

  isActive(runId: number): boolean {
    return this.activeRunId === runId;
  }

  finish(runId: number): void {
    if (this.activeRunId === runId) {
      this.activeRunId = null;
    }
  }
}

export const generationController: GenerationController = new SingleGenerationController();
