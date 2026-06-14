export class FidstyClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FidstyClientError";
  }
}
